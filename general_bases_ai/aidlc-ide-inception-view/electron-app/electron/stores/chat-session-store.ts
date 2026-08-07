import type { ChatSessionMessage, ChatSessionState } from '../../shared/chat-rag'
import {
  addTokenUsage,
  emptyTokenUsage,
  type TokenUsage
} from '../../shared/rag-chunk'

const sessions = new Map<number, ChatSessionState>()

function blank(projectId: number): ChatSessionState {
  return {
    projectId,
    messages: [],
    lastUsage: emptyTokenUsage(),
    sessionUsage: emptyTokenUsage(),
    indexChunkCount: 0,
    indexReady: false
  }
}

export function getChatSession(projectId: number): ChatSessionState {
  let s = sessions.get(projectId)
  if (!s) {
    s = blank(projectId)
    sessions.set(projectId, s)
  }
  return s
}

export function setIndexMeta(
  projectId: number,
  opts: { chunkCount: number; ready: boolean }
): ChatSessionState {
  const s = getChatSession(projectId)
  s.indexChunkCount = opts.chunkCount
  s.indexReady = opts.ready
  return s
}

export function appendChatTurn(
  projectId: number,
  user: string,
  assistant: ChatSessionMessage,
  usage: TokenUsage
): ChatSessionState {
  const s = getChatSession(projectId)
  s.messages.push({ role: 'user', content: user })
  s.messages.push(assistant)
  s.lastUsage = usage
  s.sessionUsage = addTokenUsage(s.sessionUsage, usage)
  return s
}

export function clearAllChatSessions(): void {
  sessions.clear()
}
