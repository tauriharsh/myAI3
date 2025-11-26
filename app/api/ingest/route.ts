import { NextRequest, NextResponse } from 'next/server';
import { Pinecone } from '@pinecone-database/pinecone';
import { OpenAI } from 'openai';
import pdf from 'pdf-parse';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { PINECONE_INDEX_NAME } from '@/config'; // Uses your config.ts

// Force Node.js runtime for PDF parsing
export const runtime = 'nodejs';

const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // 1. Extract Text from PDF
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const data = await pdf(buffer);
    const rawText = data.text;

    // 2. Chunk Text (Smart splitting)
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 100,
    });
    const chunks = await splitter.splitText(rawText);

    // 3. Embed & Upsert
    const index = pinecone.index(PINECONE_INDEX_NAME);

    // Process in batches of 10 to avoid timeouts
    const batchSize = 10;
    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);

      const embeddings = await Promise.all(batch.map(async (chunk) => {
        const res = await openai.embeddings.create({
          model: 'text-embedding-3-small', // Matches your Python script model
          input: chunk,
        });
        return res.data[0].embedding;
      }));

      const vectors = batch.map((chunk, idx) => ({
        id: `user_upload_${Date.now()}_${i + idx}`,
        values: embeddings[idx],
        metadata: {
          text: chunk,
          source_name: file.name,
          source_type: 'user_upload',
        },
      }));

      await index.upsert(vectors);
    }

    return NextResponse.json({ success: true, chunks: chunks.length });

  } catch (error) {
    console.error("Ingestion Error:", error);
    return NextResponse.json({ error: 'Failed to ingest document' }, { status: 500 });
  }
}
