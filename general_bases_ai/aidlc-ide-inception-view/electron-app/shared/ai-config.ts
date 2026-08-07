/** Amazon Bedrock models — N. Virginia (us-east-1). */
export const DEFAULT_AWS_REGION = 'us-east-1'
export const DEFAULT_BEDROCK_MODEL = 'amazon.nova-lite-v1:0'
export const DEFAULT_BEDROCK_EMBEDDING_MODEL = 'amazon.titan-embed-text-v2:0'
export const DEFAULT_EMBEDDING_DIMENSIONS = 1024
export const DEFAULT_RAG_TOP_K = 6
export const RAG_CHUNK_MAX_CHARS = 1200
export const RAG_CHUNK_OVERLAP = 100
/** Per Bedrock HTTP/SDK call (ms). */
export const BEDROCK_REQUEST_TIMEOUT_MS = 45_000
/** Parallel Titan embedding invokes while indexing. */
export const EMBEDDING_CONCURRENCY = 4
