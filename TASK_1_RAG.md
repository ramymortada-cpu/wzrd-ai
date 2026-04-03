# Task Brief 1: RAG on `knowledge_entries`

## Context
Currently, the system uses a hybrid in-memory semantic search (`server/vectorSearch.ts`) with a custom TF-IDF/concept extraction approach. We need to upgrade this to a true RAG (Retrieval-Augmented Generation) system using OpenAI embeddings and a vector database (or adding vector support to our existing MySQL/TiDB setup if possible, or using a lightweight vector store).
The goal is to replace the `generateSimpleEmbedding` with actual OpenAI `text-embedding-3-small` (or `ada-002`) embeddings, store them, and use cosine similarity for retrieval in `getSemanticKnowledge`.

## Target Files
- `server/vectorSearch.ts`
- `drizzle/schema.ts` (if adding vector column)
- `server/routers/premium.ts` (to ensure it uses the new RAG context)
- `server/routers/tools.ts` (to ensure it uses the new RAG context)
- `package.json` (to add vector DB client if needed, e.g., `@pinecone-database/pinecone` or similar, though we can start with in-memory or simple DB storage if vectors are small enough, but OpenAI embeddings are 1536 dims).

## Step-by-Step Instructions

1.  **Update Schema (Optional but recommended):**
    If using MySQL/TiDB, check if vector types are supported. If not, we might need to store the embedding as a JSON array in `knowledge_entries` and do in-memory cosine similarity for now (since the dataset is small), OR integrate a lightweight vector DB.
    *Decision for this task:* Let's store the 1536-dim OpenAI embedding as a `json` column in `knowledge_entries` for now to keep infrastructure simple, and do in-memory cosine similarity on startup/refresh, just like the current `vectorStore`.

    Update `drizzle/schema.ts`:
    Add `embedding: json("embedding")` to `knowledgeEntries`.

2.  **Implement OpenAI Embeddings:**
    In `server/vectorSearch.ts`, replace `generateSimpleEmbedding` with a call to OpenAI's embedding API.
    ```typescript
    import OpenAI from 'openai';
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    async function generateOpenAIEmbedding(text: string): Promise<number[]> {
      const response = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: text,
      });
      return response.data[0].embedding;
    }
    ```

3.  **Update Indexing Logic:**
    Modify `indexKnowledgeBase` in `server/vectorSearch.ts` to:
    - Check if an entry already has an `embedding` in the DB.
    - If not, generate it using `generateOpenAIEmbedding`, save it to the DB (`update` the `knowledge_entries` row), and add it to the in-memory `vectorStore`.
    - If it does, just load it into the in-memory `vectorStore`.

4.  **Update Search Logic:**
    Modify `semanticSearch` to:
    - Generate an embedding for the `query` using `generateOpenAIEmbedding`.
    - Calculate cosine similarity between the query embedding and the stored embeddings.
    - Return the top results.

5.  **Integrate with Tools & Premium:**
    Ensure `getSemanticKnowledge` is called in `server/routers/premium.ts` and `server/routers/tools.ts` to inject relevant knowledge into the Claude/LLM prompts.
    Currently, `premium.ts` uses `buildWebsiteContext` but doesn't seem to actively fetch from `getSemanticKnowledge`. We need to inject the RAG context into the `userPrompt` or `systemPrompt`.
    - In `premium.ts`, after fetching website data, call `getSemanticKnowledge(userPrompt)` and append it to the prompt.
    - In `tools.ts`, do the same before calling `callDiagnosisModel`.

## Expected Outcome
- The system uses OpenAI embeddings for semantic search.
- Knowledge entries are automatically embedded and stored.
- Premium reports and tools utilize the RAG context to provide more accurate, methodology-aligned advice.

## Verification
- Run `pnpm run dev`.
- Trigger a tool diagnosis or premium report.
- Check the server logs to ensure `generateOpenAIEmbedding` is called and `getSemanticKnowledge` returns relevant chunks.
- Verify that the `knowledge_entries` table has the `embedding` JSON populated.
