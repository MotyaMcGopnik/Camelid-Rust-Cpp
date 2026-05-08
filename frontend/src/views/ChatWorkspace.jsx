import { useEffect, useState } from 'react'

import { compatibilityHintCopy, compatibilityHintLabel, findCompatibilityHint, isCompatibilitySupportedForModel } from '../lib/capabilities'
import { clampText, formatDate } from '../lib/formatters'
import { getChatGateState } from '../lib/chatGate'
import { describeModelState, getModelStatusLabel, isRunnableInCurrentRuntime } from '../lib/modelState'

const isBootstrapMessage = (message) =>
  message?.role === 'assistant' &&
  typeof message?.content === 'string' &&
  message.content.startsWith('Conversation created.')

const cleanLegacyDemoCapCopy = (value) => {
  if (typeof value !== 'string') return value
  return value
    .replace(/\s*\(demo cap\)/gi, '')
    .replace(/\s*·\s*raw\s+16-token-cap\s+local\s+run;\s*inspect\s+before\s+trusting\s+polish/gi, ' · raw local run')
    .replace(/\s*Longer-generation\s+polish\s+still\s+needs\s+separate\s+validation\.?/gi, '')
    .replace(/\s*Longer\s+generation\s+is\s+not\s+polished\s+yet\.?/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

export default function ChatWorkspace({
  selectedConversation,
  selectedModel,
  selectedModelId,
  setSelectedModelId,
  models,
  runtime,
  capabilities,
  pendingConversation,
  composer,
  setComposer,
  saveToMemory,
  sendMessage,
  sending,
  selectedModelRunnable,
  setTab,
}) {
  const [generationElapsedSeconds, setGenerationElapsedSeconds] = useState(0)
  const visibleMessages = (selectedConversation?.messages || []).filter((message) => !isBootstrapMessage(message))
  const pendingPrompt = (pendingConversation?.content || (sending ? composer.trim() : '')).trim()
  const pendingPromptAlreadyVisible = Boolean(
    pendingPrompt && [...visibleMessages].reverse().some((message) => message.role === 'user' && message.content === pendingPrompt),
  )
  const pendingUserPrompt = pendingPromptAlreadyVisible ? '' : pendingPrompt
  const awaitingAssistant = Boolean(sending && pendingPrompt)

  useEffect(() => {
    if (!sending) {
      setGenerationElapsedSeconds(0)
      return undefined
    }
    setGenerationElapsedSeconds(0)
    const startedAt = Date.now()
    const interval = window.setInterval(() => {
      setGenerationElapsedSeconds(Math.max(1, Math.floor((Date.now() - startedAt) / 1000)))
    }, 1000)
    return () => window.clearInterval(interval)
  }, [sending])

  const isFreshThread = selectedConversation ? (visibleMessages.length === 0 && !pendingPrompt) : !pendingPrompt
  const handleComposerKeyDown = async (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      if (canSubmit) {
        await sendMessage()
      }
    }
  }

  const rawConversationTitle = selectedConversation?.title?.trim()
  const hasCustomConversationTitle = Boolean(rawConversationTitle && rawConversationTitle.toLowerCase() !== 'new conversation')
  const conversationLabel = clampText(hasCustomConversationTitle ? rawConversationTitle : 'Untitled chat', 30)
  const lastUpdated = selectedConversation?.updated_at ? formatDate(selectedConversation.updated_at) : null
  const runnableModels = models.filter((model) => getChatGateState(capabilities, model, runtime).chatUnlocked)
  const hasRunnableChoices = runnableModels.length > 0
  const modelPickerTitle = selectedModel ? getModelStatusLabel(selectedModel) : 'Choose what Camelid should use for this chat.'
  const selectedChatGate = getChatGateState(capabilities, selectedModel, runtime)
  const selectedRuntimeReady = selectedChatGate.runtimeReady || isRunnableInCurrentRuntime(selectedModel, runtime)
  const selectedModelCapabilitySupported = selectedChatGate.contractSupported || isCompatibilitySupportedForModel(capabilities, selectedModel)
  const supportBlocked = selectedRuntimeReady && !selectedModelCapabilitySupported
  const selectedModelMeta = supportBlocked
    ? 'Load a supported model to chat'
    : !selectedModelRunnable
      ? describeModelState(selectedModel)
      : runtime?.loaded_now && runtime?.active_model_id === selectedModelId
      ? 'Ready'
      : 'Ready to chat'
  const canSubmit = Boolean(composer.trim()) && selectedModelRunnable && !sending
  const selectedCompatibilityHint = findCompatibilityHint(capabilities, selectedModel)
  const selectedCompatibilityLabel = selectedModel
    ? compatibilityHintLabel(selectedCompatibilityHint, 'No matching COMPATIBILITY.md row')
    : 'No model selected'
  const selectedCompatibilityCopy = selectedModel
    ? compatibilityHintCopy(selectedCompatibilityHint)
    : 'Choose a model before inferring any support boundary. Camelid will not promote filenames or saved paths into compatibility claims.'
  const selectedModelName = selectedModel?.name || selectedModelId || 'No model selected'
  const emptyHeroEyebrow = 'Camelid'
  const readinessState = selectedModelRunnable ? 'ready' : supportBlocked ? 'blocked' : selectedModel ? 'waiting' : 'idle'
  const readinessLabel = selectedModelRunnable
    ? 'Ready'
    : supportBlocked
      ? 'Choose a supported model'
      : selectedModel
        ? 'Loading model'
        : 'Choose a model to begin'
  const productHeroTitle = selectedModelRunnable
    ? 'How can I help?'
    : supportBlocked
      ? 'Choose a supported model.'
      : 'Load a model to begin.'
  const productHeroSummary = selectedModelRunnable
    ? ''
    : supportBlocked
      ? ''
      : ''
  const renderModelPicker = () => {
    if (!hasRunnableChoices) {
      return (
        <button className="ghost-button ghost-button-quiet" onClick={() => setTab('library')}>
          Choose model
        </button>
      )
    }

    return (
      <label className="composer-model-picker" title={modelPickerTitle}>
        <span className="composer-tool-label">Model</span>
        <select
          className="composer-model-select"
          aria-label="Choose model for chat"
          value={selectedModelId}
          onChange={(e) => setSelectedModelId(e.target.value)}
          disabled={sending}
        >
          {runnableModels.map((model) => (
            <option key={model.id} value={model.id}>
              {model.name}
            </option>
          ))}
        </select>
      </label>
    )
  }


  return (
    <section className={`chat-layout chat-layout-gemini view-stack ${isFreshThread ? 'chat-layout-empty' : ''}`}>
      {selectedConversation && (
        <div className="mobile-conversation-bar" aria-label="Conversation navigation">
          <button className="ghost-button mobile-conversation-trigger" onClick={() => setTab('history')}>
            <span>Conversations</span>
            <strong title={rawConversationTitle || 'Untitled chat'}>{conversationLabel}</strong>
          </button>
          <div className="mobile-conversation-status">
            {lastUpdated ? `Updated ${lastUpdated}` : 'Current thread'}
          </div>
        </div>
      )}

      <div className={`chat-canvas ${isFreshThread ? 'chat-canvas-empty' : ''}`}>
        {isFreshThread ? (
          <div className="chat-empty-shell chat-empty-shell-gemini">
            <div className={`chat-empty-stage chat-empty-stage-clean chat-empty-stage-product is-${readinessState}`}>
              <div className="chat-empty-hero chat-empty-hero-gemini chat-empty-hero-clean">
                <p className="chat-empty-greeting">{emptyHeroEyebrow}</p>
                <h2>{productHeroTitle}</h2>
                {productHeroSummary && <p className="hero-summary">{productHeroSummary}</p>}
              </div>

              <div className="composer composer-gemini composer-gemini-stage composer-gemini-stage-clean composer-gemini-product">
                <textarea className="composer-input composer-input-gemini composer-input-gemini-stage" value={composer} onChange={(e) => setComposer(e.target.value)} onKeyDown={handleComposerKeyDown} rows={2} placeholder={selectedModelRunnable ? 'Message Camelid…' : 'Load a model first'} disabled={sending || !selectedModelRunnable} />
                <div className="composer-gemini-footer composer-gemini-footer-stage composer-gemini-footer-stage-clean">
                  <div className="composer-gemini-tools composer-gemini-tools-stage composer-gemini-tools-stage-clean">
                    {renderModelPicker()}
                    {!selectedModelRunnable && hasRunnableChoices && <button className="ghost-button ghost-button-quiet" onClick={() => setTab('library')}>Open Library</button>}
                  </div>
                  <div className="composer-gemini-actions composer-gemini-actions-stage">
                    <button className="primary-button composer-send-button" onClick={sendMessage} disabled={!canSubmit}>{sending ? `Generating ${generationElapsedSeconds}s…` : 'Send'}</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className={`chat-session-strip is-${readinessState}`} aria-label="Current Camelid chat status">
              <span className="chat-session-dot" aria-hidden="true" />
              <strong>{selectedModelName}</strong>
              <small>{selectedModelRunnable ? 'Ready when you are' : readinessLabel}</small>
            </div>

            {!selectedModelRunnable && (
              <div className="setup-card setup-card-inline setup-card-gemini">
                <div>
                  <p className="panel-kicker">Before you chat</p>
                  <h2>{supportBlocked ? 'Support contract needs an exact row' : 'Choose a runnable model'}</h2>
                  <p className="hero-summary">{supportBlocked ? `${selectedCompatibilityLabel}. ${selectedCompatibilityCopy}` : describeModelState(selectedModel)}</p>
                </div>
                <div className="composer-actions single-action-row">
                  <button className="primary-button" onClick={() => setTab('library')}>Open Library</button>
                </div>
              </div>
            )}

            <div className="chat-thread chat-thread-gemini">
              {visibleMessages.length === 0 && !awaitingAssistant && <div className="empty-state empty-state-chat">Pick a ready model, then send the first message when you’re ready.</div>}
              {visibleMessages.map((message) => {
                const messageContent = cleanLegacyDemoCapCopy(message.content)

                return (
                  <article key={message.id} className={`message-row message-row-gemini ${message.role}`}>
                    <div className={`message-bubble message-bubble-gemini ${message.role}`}>
                      <p>{messageContent}</p>
                    </div>
                  </article>
                )
              })}
              {awaitingAssistant && (
                <>
                  {pendingUserPrompt && (
                    <article className="message-row message-row-gemini user pending">
                      <div className="message-bubble message-bubble-gemini user pending">
                        <p>{pendingUserPrompt}</p>
                      </div>
                    </article>
                  )}
                  <article className="message-row message-row-gemini assistant pending">
                    <div className="message-thinking-loader camelid-walk-loader" aria-hidden="true">
                      <span className="camelid-walk-ground" />
                      <span className="camelid-walk-body" />
                      <span className="camelid-walk-hump" />
                      <span className="camelid-walk-neck" />
                      <span className="camelid-walk-head" />
                      <span className="camelid-walk-ear" />
                      <span className="camelid-walk-tail" />
                      <span className="camelid-walk-leg camelid-walk-leg-1" />
                      <span className="camelid-walk-leg camelid-walk-leg-2" />
                      <span className="camelid-walk-leg camelid-walk-leg-3" />
                      <span className="camelid-walk-leg camelid-walk-leg-4" />
                    </div>
                    <div className="message-bubble message-bubble-gemini assistant pending">
                      <div className="message-heading message-heading-clean">
                        <span className="message-micro-meta">Generating locally · {generationElapsedSeconds}s elapsed</span>
                      </div>
                      <p className="message-placeholder-copy">Camelid is running locally. Tokens will appear as they are generated.</p>
                    </div>
                  </article>
                </>
              )}
            </div>
          </>
        )}
      </div>

      {!isFreshThread && (
        <div className="composer composer-gemini composer-gemini-floating">
          <textarea className="composer-input composer-input-gemini" value={composer} onChange={(e) => setComposer(e.target.value)} onKeyDown={handleComposerKeyDown} rows={3} placeholder={selectedModelRunnable ? 'Ask a local test prompt' : 'Pick a ready model first, then start your chat'} disabled={sending || !selectedModelRunnable} />
          <div className="composer-gemini-footer">
            <div className="composer-gemini-tools">
              {renderModelPicker()}
              <span className="composer-meta-pill">{selectedModelMeta}</span>
              {selectedModelRunnable && <button className="ghost-button subtle-action" onClick={saveToMemory} disabled={sending}>Save to memory</button>}
            </div>
            <div className="composer-gemini-actions">
              {!selectedModelRunnable && hasRunnableChoices && <button className="ghost-button" onClick={() => setTab('library')}>Open Library</button>}
              <button className="primary-button composer-send-button" onClick={sendMessage} disabled={!canSubmit}>{sending ? `Generating ${generationElapsedSeconds}s…` : 'Send'}</button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
