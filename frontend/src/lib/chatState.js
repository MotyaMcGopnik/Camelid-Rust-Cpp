export const NEW_CHAT_SENTINEL = '__new__'

export function resolveSelectedConversation(conversations, selectedConversationId) {
  if (!selectedConversationId || selectedConversationId === NEW_CHAT_SENTINEL) return null
  return (conversations || []).find((conversation) => conversation.id === selectedConversationId) || null
}

export function shouldCreateConversationForSend(selectedConversation, selectedConversationId) {
  return selectedConversationId === NEW_CHAT_SENTINEL || !selectedConversation
}
