-- Drop the old index (dimension is baked into the ivfflat index)
DROP INDEX IF EXISTS "knowledge_base_embedding_idx";

-- Resize embedding column from 768 (Gemini text-embedding-004) to 384
-- (local all-MiniLM-L6-v2 model, since Groq has no embeddings endpoint)
ALTER TABLE "knowledge_base" ALTER COLUMN "embedding" TYPE vector(384);

-- Recreate the ANN index for the new dimension
CREATE INDEX "knowledge_base_embedding_idx" ON "knowledge_base" USING ivfflat ("embedding" vector_cosine_ops) WITH (lists = 100);
