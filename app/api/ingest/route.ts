import { NextResponse } from "next/server";
import { Pinecone } from "@pinecone-database/pinecone";
import { OpenAI } from "openai";

export const runtime = "nodejs";

// Initialize clients
const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// Config
const INDEX_NAME = process.env.PINECONE_INDEX || "my-ai";
const EMBEDDING_MODEL =
  process.env.EMBEDDING_MODEL || "text-embedding-3-small";

// ---- POST handler ----
// This expects JSON text chunks, NOT PDFs.
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

    // Extra safety: Vercel body limit protection
    if (text.length > 1_000_000) {
      return NextResponse.json(
        {
          error: `Chunk too large (${text.length} chars). Reduce chunk size on the client.`,
        },
        { status: 413 }
      );
    }

    console.log(
      `Embedding chunk ${chunk_index + 1}/${total_chunks} from ${filename}...`
    );

    // 1. Create embedding
    const embeddingResponse = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: text,
    });

    const vector = embeddingResponse.data[0].embedding;

    // 2. Upsert to Pinecone
    const index = pinecone.index(INDEX_NAME);

    const vector_id = `${filename.replace(/\W/g, "_")}_chunk_${chunk_index}`;

    await index.upsert([
      {
        id: vector_id,
        values: vector,
        metadata: {
          source_name: filename,
          chunk_index,
          total_chunks,
          text_preview: text.slice(0, 500),
        },
      },
    ]);

    return NextResponse.json({
      success: true,
      chunk_index,
      total_chunks,
      id: vector_id,
    });
  } catch (error: any) {
    console.error("Ingest chunk error:", error);

    return NextResponse.json(
      {
        error:
          error?.message || "Failed to process chunk. See server logs for details.",
      },
      { status: 500 }
    );
  }
}
