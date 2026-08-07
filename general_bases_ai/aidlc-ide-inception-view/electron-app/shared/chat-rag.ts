import type { TokenUsage } from './rag-chunk'
import type { ChatMessage } from './types'

export type WorkspaceMode = 'observations' | 'chat'

export interface ChatCitation {
  path: string
  excerpt: string
}

export interface ChatSessionMessage extends ChatMessage {
  citations?: ChatCitation[]
  usage?: TokenUsage
}

export interface ChatSessionState {
  projectId: number
  messages: ChatSessionMessage[]
  lastUsage: TokenUsage
  sessionUsage: TokenUsage
  indexChunkCount: number
  indexReady: boolean
}

export interface ChatSendRequest {
  projectId: number
  message: string
  openPath?: string | null
}

export interface ChatSendResult {
  session: ChatSessionState
  assistantMessage: string
  citations: ChatCitation[]
  usage: TokenUsage
}

export interface RagReindexResult {
  projectId: number
  chunkCount: number
  fileCount: number
  /** True when existing on-disk index was reused (no Bedrock call). */
  skipped?: boolean
}
