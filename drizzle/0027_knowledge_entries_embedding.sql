-- Persist OpenAI embeddings for semantic RAG on knowledge_entries
ALTER TABLE `knowledge_entries` ADD COLUMN `embedding` json;
