import { NextRequest, NextResponse } from 'next/server';
import { Pinecone } from '@pinecone-database/pinecone';
import { OpenAI } from 'openai';
import pdf from 'pdf-parse';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { PINECONE_INDEX_NAME } from '@/config';

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

    // Validate file size (allow up to 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File too large. Maximum size is 50MB, got ${(file.size / 1024 / 1024).toFixed(2)}MB` },
        { status: 413 }
      );
    }

    console.log(`Processing file: ${file.name}, Size: ${(file.size / 1024 / 1024).toFixed(2)}MB`);

    // 1. Extract Text from PDF
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const data = await pdf(buffer);
    const rawText = data.text;

    if (!rawText || rawText.trim().length === 0) {
      return NextResponse.json(
        { error: 'PDF contains no readable text' },
        { status: 400 }
      );
    }

    console.log(`Extracted ${rawText.length} characters from PDF`);

    // 2. Chunk Text (Smart splitting)
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 100,
    });

    const chunks = await splitter.splitText(rawText);
    console.log(`Split into ${chunks.length} chunks`);

    if (chunks.length === 0) {
      return NextResponse.json(
        { error: 'No chunks generated from PDF' },
        { status: 400 }
      );
    }

    // 3. Embed & Upsert
    const index = pinecone.index(PINECONE_INDEX_NAME);

    // Process in batches of 5 (reduced from 10 to avoid timeout)
    const batchSize = 5;
    let processedChunks = 0;

    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);

      try {
        // Generate embeddings for batch
        const embeddings = await Promise.all(
          batch.map(async (chunk) => {
            const res = await openai.embeddings.create({
              model: 'text-embedding-3-small',
              input: chunk,
            });
            return res.data[0].embedding;
          })
        );

        // Create vectors with metadata
        const vectors = batch.map((chunk, idx) => ({
          id: `user_upload_${Date.now()}_${i + idx}`,
          values: embeddings[idx],
          metadata: {
            text: chunk,
            source_name: file.name,
            source_type: 'user_upload',
            chunk_index: i + idx,
          },
        }));

        // Upsert to Pinecone
        await index.upsert(vectors);
        processedChunks += batch.length;

        console.log(`Processed ${processedChunks}/${chunks.length} chunks`);
      } catch (batchError) {
        console.error(`Error processing batch at index ${i}:`, batchError);
        throw batchError;
      }
    }

    console.log(`Successfully ingested ${file.name} with ${processedChunks} chunks`);

    return NextResponse.json({
      success: true,
      chunks: processedChunks,
      filename: file.name,
      message: `Successfully processed ${file.name}`,
    });
  } catch (error) {
    console.error('Ingestion Error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Failed to ingest document';

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
