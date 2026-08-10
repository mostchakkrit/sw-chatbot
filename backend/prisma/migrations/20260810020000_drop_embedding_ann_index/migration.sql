-- The ivfflat index requires roughly (row_count >= lists) to build meaningful
-- clusters. With a small FAQ-scale knowledge_base (dozens to low hundreds of
-- rows), it left most of the 100 lists empty, and default probes=1 frequently
-- searched an empty list and returned zero results.
--
-- At this data scale, an exact sequential scan over "embedding <=> query" is
-- fast enough and always correct, so we drop the ANN index rather than tune
-- lists/probes. Revisit only if the knowledge_base grows past ~10k rows.
DROP INDEX IF EXISTS "knowledge_base_embedding_idx";
