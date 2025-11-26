import { Pinecone } from '@pinecone-database/pinecone';
import { OpenAI } from 'openai';
import { PINECONE_INDEX_NAME, PINECONE_TOP_K } from '@/config';

if (!process.env.PINECONE_API_KEY) {
    throw new Error('PINECONE_API_KEY is not set');
}

// Initialize Clients
const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY,
});

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function searchPinecone(query: string): Promise<string> {
    try {
        // 1. Generate Embedding (Must match the model used in ingestion)
        const embeddingResponse = await openai.embeddings.create({
            model: 'text-embedding-3-small',
            input: query,
        });
        const embedding = embeddingResponse.data[0].embedding;

        // 2. Query the Index
        const index = pinecone.index(PINECONE_INDEX_NAME);
        const queryResponse = await index.query({
            vector: embedding,
            topK: PINECONE_TOP_K ?? 5,
            includeMetadata: true,
        });

        // 3. Format the results for the LLM
        if (queryResponse.matches.length === 0) {
            return "No relevant documentation found in the knowledge base.";
        }

        const formattedResults = queryResponse.matches.map((match) => {
            const metadata = match.metadata as any;
            return `
Source: ${metadata?.source_name || 'Unknown'} (${metadata?.type || 'general'})
Description: ${metadata?.description || ''}
Context: ${metadata?.text || ''}
            `.trim();
        }).join('\n\n---\n\n');

        return formattedResults;

    } catch (error) {
        console.error("Error querying Pinecone:", error);
        return "Error retrieving information from the knowledge base.";
    }
}
