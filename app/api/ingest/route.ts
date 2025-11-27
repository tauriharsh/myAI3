import { NextResponse } from "next/server";
import { Pinecone } from "@pinecone-database/pinecone";
import { OpenAI } from "openai";
import { PINECONE_INDEX_NAME } from "@/config";
import pdf from "pdf-parse";

export const runtime = "nodejs";

// Initialize clients
const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// Config
const INDEX_NAME = PINECONE_INDEX_NAME || "my-openai";
const EMBEDDING_MODEL = "text-embedding-3-small";
const CHUNK_SIZE = 1000; // Characters per chunk
const CHUNK_OVERLAP = 200; // Overlap between chunks

function chunkText(text: string, chunkSize: number, overlap: number): string[] {
  const chunks: string[] = [];
  let start = 0;
  
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push(text.slice(start, end));
    start = end - overlap;
    
    if (start >= text.length - overlap) break;
  }
  
  return chunks;
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Only PDF files are supported" },
        { status: 400 }
      );
    }

    console.log(`[Ingest] Processing PDF: ${file.name}`);

    // Convert file to buffer (using Buffer.from to avoid deprecation warning)
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(new Uint8Array(arrayBuffer));

    // Parse PDF
    const pdfData = await pdf(buffer);
    const text = pdfData.text;

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: "No text content found in PDF" },
        { status: 400 }
      );
    }

    console.log(`[Ingest] Extracted ${text.length} characters from PDF`);

    // Chunk the text
    const chunks = chunkText(text, CHUNK_SIZE, CHUNK_OVERLAP);
    console.log(`[Ingest] Created ${chunks.length} chunks`);

    // Get Pinecone index
    const index = pinecone.index(INDEX_NAME);

    // Process chunks in batches
    const batchSize = 10;
    const vectors = [];

    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);
      
      console.log(`[Ingest] Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(chunks.length / batchSize)}`);

      // Create embeddings for batch
      const embeddingResponse = await openai.embeddings.create({
        model: EMBEDDING_MODEL,
        input: batch,
      });

      // Prepare vectors for this batch
      for (let j = 0; j < batch.length; j++) {
        const chunkIndex = i + j;
        const vector_id = `${file.name.replace(/\W/g, "_")}_chunk_${chunkIndex}`;
        
        vectors.push({
          id: vector_id,
          values: embeddingResponse.data[j].embedding,
          metadata: {
            source_name: file.name,
            source_type: "user_upload",
            chunk_index: chunkIndex,
            total_chunks: chunks.length,
            text: batch[j],
          },
        });
      }
    }

    // Upsert all vectors to Pinecone
    console.log(`[Ingest] Upserting ${vectors.length} vectors to Pinecone`);
    await index.upsert(vectors);

    return NextResponse.json({
      success: true,
      chunks: chunks.length,
      filename: file.name,
    });

  } catch (error: any) {
    console.error("Ingestion Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to ingest document" },
      { status: 500 }
    );
  }
}
