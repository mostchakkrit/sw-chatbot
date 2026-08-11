-- Drop the products feature (replaced by FAQ management on the knowledge_base table)
DROP TABLE "products";

-- Add an explicit question field to knowledge_base for FAQ-style entries
ALTER TABLE "knowledge_base" ADD COLUMN "question" TEXT;
