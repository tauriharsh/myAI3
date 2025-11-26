import { NextResponse } from "next/server";
import { Pinecone } from "@pinecone-database/pinecone";
import { OpenAI } from "openai";
import { PINECONE_INDEX_NAME } from "@/config"; // Using your centralized config

export const runtime = "nodejs";

// Initialize clients
const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// Config
// FIX: Use the correct index name from your config, or fallback to 'my-openai'
const INDEX_NAME = PINECONE_INDEX_NAME || "my-openai";
const EMBEDDING_MODEL = "text-embedding-3-small";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { text, filename, chunk_index, total_chunks } = body || {};

    // Validation
    if (!text || !filename) {
      return NextResponse.json(
        { error: "Missing 'text' or 'filename' in request body." },
        { status: 400 }
      );
    }

    console.log(
      `[Ingest] Embedding chunk ${chunk_index + 1}/${total_chunks} from ${filename}...`
    );

    // 1. Create embedding
    const embeddingResponse = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: text,
    });

    const vector = embeddingResponse.data[0].embedding;

    // 2. Upsert to Pinecone
    const index = pinecone.index(INDEX_NAME);

    // Create a unique ID for this chunk
    const vector_id = `${filename.replace(/\W/g, "_")}_chunk_${chunk_index}`;

    await index.upsert([
      {
        id: vector_id,
        values: vector,
        metadata: {
          source_name: filename,
          source_type: "user_upload", // Useful for filtering
          chunk_index,
          total_chunks,
          text: text, // Store text so the bot can read it later
        },
      },
    ]);

    return NextResponse.json({
      success: true,
      chunk_index,
      id: vector_id,
    });
  } catch (error: any) {
    console.error("Ingestion Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to ingest chunk" },
      { status: 500 }
    );
  }
}
