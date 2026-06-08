import { memo, useEffect, useRef, useState } from 'react'
import { Avatar } from '../ui/Avatar'
import { IconCopy, IconCheck, IconRefresh } from '../ui/icons'
import { AssistantMarkdown, copyText, hasOpenCodeFence } from '../../lib/markdown'
import { cleanLegacyDemoCapCopy } from '../../lib/conversationStorage'
import {
  LiveGenerationBadge,
  StreamingLoader,
  streamingStatusLabel,
} from './render/StreamingIndicator'
import { ParityReceiptCard } from './render/ParityReceipt'
import { DeveloperDiagnosticsBlock } from './render/Diagnostics'

export const MessageTurn = memo(function MessageTurn({ message, generationElapsedSeconds, priorUserPrompt, onReusePrompt }) {
  const [copied, setCopied] = useState(false)
  const copiedResetRef = useRef(null)
  const messageContent = cleanLegacyDemoCapCopy(message.content)
  const isUser = message.role === 'user'
  const assistantStreaming = message.role === 'assistant' && Boolean(message.streaming)
  const isOpenStreamingCode = assistantStreaming && hasOpenCodeFence(messageContent)
  const streamingPhase = message.streaming_phase || (messageContent ? 'streaming' : 'generating')
  const liveStatusLabel = streamingStatusLabel(streamingPhase, generationElapsedSeconds, isOpenStreamingCode)
  const showStreamingStatus = assistantStreaming && !messageContent
  const showLiveGenerationBadge = assistantStreaming && Boolean(messageContent)
  const showLengthWarning = message.role === 'assistant' && !assistantStreaming && message.finish_reason === 'length'
  const showErrorWarning = message.role === 'assistant' && !assistantStreaming && message.finish_reason === 'error'
  const showInterruptedWarning = message.role === 'assistant' && !assistantStreaming && message.finish_reason === 'interrupted'
  const showReusePromptAction = Boolean(priorUserPrompt) && (showErrorWarning || showInterruptedWarning)
  const showMessageActions = message.role === 'assistant' && Boolean(String(messageContent || '').trim())

  useEffect(() => () => {
    if (copiedResetRef.current) window.clearTimeout(copiedResetRef.current)
  }, [])

  const handleCopyMessage = async () => {
    await copyText(messageContent)
    setCopied(true)
    if (copiedResetRef.current) window.clearTimeout(copiedResetRef.current)
    copiedResetRef.current = window.setTimeout(() => setCopied(false), 1600)
  }

  if (isUser) {
    return (
      <article className="cxturn cxturn--user">
        <div className="cxturn__user-chip"><p>{messageContent}</p></div>
      </article>
    )
  }

  return (
    <article
      className={`cxturn cxturn--assistant ${assistantStreaming ? 'is-streaming' : ''}`}
      aria-busy={assistantStreaming ? 'true' : undefined}
      data-streaming-state={assistantStreaming ? 'active' : undefined}
      data-streaming-code-state={isOpenStreamingCode ? 'open' : undefined}
    >
      <div className="cxturn__avatar"><Avatar size={30} /></div>
      <div className="cxturn__body">
        {showStreamingStatus && <StreamingLoader elapsedSeconds={generationElapsedSeconds} label={liveStatusLabel} compact />}
        {(messageContent || !assistantStreaming) && <AssistantMarkdown content={messageContent} streaming={assistantStreaming} />}
        {showLiveGenerationBadge && <LiveGenerationBadge elapsedSeconds={generationElapsedSeconds} label={liveStatusLabel} />}

        {showLengthWarning && (
          <div className="cxturn__warning" role="status">Stopped before completing. Ask “continue” for a complete file.</div>
        )}
        {showErrorWarning && (
          <div className="cxturn__warning cxturn__warning--error" role="status">Generation stopped before Camelid returned a complete reply.</div>
        )}
        {showInterruptedWarning && (
          <div className="cxturn__warning cxturn__warning--interrupted" role="status">Generation was interrupted before the reply finished.</div>
        )}

        {(showMessageActions || showReusePromptAction) && (
          <div className="cxturn__actions" aria-label="Message actions">
            {showMessageActions && (
              <button type="button" className="cxturn__action" onClick={handleCopyMessage}>
                {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            )}
            {showReusePromptAction && (
              <button type="button" className="cxturn__action" onClick={() => onReusePrompt?.(priorUserPrompt)}>
                <IconRefresh size={16} /> <span>Use prompt again</span>
              </button>
            )}
          </div>
        )}

        {message.role === 'assistant' && !assistantStreaming && message.camelid_receipt && (
          <ParityReceiptCard receipt={message.camelid_receipt} />
        )}
        <DeveloperDiagnosticsBlock message={message} />
      </div>
    </article>
  )
})

export default MessageTurn
