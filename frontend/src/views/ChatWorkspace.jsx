import { compatibilityHintCopy, compatibilityHintLabel, findCompatibilityHint, isCompatibilitySupportedForModel, isSupportedCapabilityStatus } from '../lib/capabilities'
import { clampText, formatDate, formatRate } from '../lib/formatters'
import { getChatGateState } from '../lib/chatGate'
import { describeModelState, getModelStatusLabel, isRunnableInCurrentRuntime } from '../lib/modelState'

const isBootstrapMessage = (message) =>
  message?.role === 'assistant' &&
  typeof message?.content === 'string' &&
  message.content.startsWith('Conversation created.')

const formatProbability = (value) => {
  const number = Number(value)
  if (!Number.isFinite(number)) return '—'
  return `${(number * 100).toFixed(number >= 0.1 ? 1 : 2)}%`
}

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
  latestAssistantMessage,
  pendingConversation,
  composer,
  setComposer,
  saveToMemory,
  sendMessage,
  sending,
  selectedModelRunnable,
  setTab,
}) {
  const visibleMessages = (selectedConversation?.messages || []).filter((message) => !isBootstrapMessage(message))
  const pendingPrompt = (pendingConversation?.content || (sending ? composer.trim() : '')).trim()
  const pendingPromptAlreadyVisible = Boolean(
    pendingPrompt && [...visibleMessages].reverse().some((message) => message.role === 'user' && message.content === pendingPrompt),
  )
  const pendingUserPrompt = pendingPromptAlreadyVisible ? '' : pendingPrompt
  const awaitingAssistant = Boolean(sending && pendingPrompt)
  const isFreshThread = selectedConversation ? (visibleMessages.length === 0 && !pendingPrompt) : !pendingPrompt
  const latestVisibleAssistantMessage = [...visibleMessages].reverse().find((message) => message.role === 'assistant') || latestAssistantMessage

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
  const latestTelemetryMatchesSelection = !latestVisibleAssistantMessage?.model_id || latestVisibleAssistantMessage.model_id === selectedModelId
  const latestTelemetryMessage = latestTelemetryMatchesSelection ? latestVisibleAssistantMessage : null
  const speedLabel = latestTelemetryMessage?.tokens_out_per_sec !== null && latestTelemetryMessage?.tokens_out_per_sec !== undefined
    ? formatRate(latestTelemetryMessage.tokens_out_per_sec)
    : 'Waiting for first reply'
  const latestGeneratedTokens = latestTelemetryMessage?.usage?.completion_tokens
  const latestFirstGeneratedToken = latestTelemetryMessage?.generated_token_ids?.[0]
  const latestFirstTokenCopy = latestFirstGeneratedToken !== null && latestFirstGeneratedToken !== undefined ? ` · first token #${latestFirstGeneratedToken}` : ''
  const latestCompletionCopy = latestGeneratedTokens === 1
    ? `1 completion token${latestFirstTokenCopy} · first-token path completed`
    : latestGeneratedTokens
      ? `${latestGeneratedTokens} completion tokens${latestFirstTokenCopy} · raw local run`
      : 'First reply will establish the live TPS baseline for this loaded model.'
  const staleTelemetryModelLabel = latestVisibleAssistantMessage?.model_id && !latestTelemetryMatchesSelection
    ? (latestVisibleAssistantMessage.model_name || latestVisibleAssistantMessage.model_id)
    : ''
  const runnableModels = models.filter((model) => getChatGateState(capabilities, model, runtime).chatUnlocked)
  const hasRunnableChoices = runnableModels.length > 0
  const modelPickerTitle = selectedModel ? getModelStatusLabel(selectedModel) : 'Choose what Camelid should use for this chat.'
  const selectedChatGate = getChatGateState(capabilities, selectedModel, runtime)
  const selectedRuntimeReady = selectedChatGate.runtimeReady || isRunnableInCurrentRuntime(selectedModel, runtime)
  const selectedModelCapabilitySupported = selectedChatGate.contractSupported || isCompatibilitySupportedForModel(capabilities, selectedModel)
  const supportBlocked = selectedRuntimeReady && !selectedModelCapabilitySupported
  const selectedModelMeta = supportBlocked
    ? 'Loaded, but not supported by the current compatibility contract'
    : !selectedModelRunnable
      ? describeModelState(selectedModel)
      : runtime?.loaded_now && runtime?.active_model_id === selectedModelId
      ? (isFreshThread ? 'Loaded + generation-ready' : speedLabel)
      : isFreshThread
        ? 'Ready to chat'
        : speedLabel
  const canSubmit = Boolean(composer.trim()) && selectedModelRunnable && !sending
  const selectedCompatibilityHint = findCompatibilityHint(capabilities, selectedModel)
  const selectedCompatibilityTarget = selectedCompatibilityHint?.kind === 'compatibility' ? selectedCompatibilityHint.target : null
  const selectedCompatibilitySupported = selectedCompatibilityTarget ? isSupportedCapabilityStatus(selectedCompatibilityTarget.status) : false
  const selectedCompatibilityLabel = selectedModel
    ? compatibilityHintLabel(selectedCompatibilityHint, 'No matching COMPATIBILITY.md row')
    : 'No model selected'
  const selectedCompatibilityCopy = selectedModel
    ? compatibilityHintCopy(selectedCompatibilityHint)
    : 'Choose a model before inferring any support boundary. Camelid will not promote filenames or saved paths into compatibility claims.'
  const selectedModelName = selectedModel?.name || selectedModelId || 'No model selected'
  const emptyHeroEyebrow = selectedModelRunnable
    ? 'Local chat preview'
    : supportBlocked
      ? 'Support match needed'
      : 'Camelid local chat'
  const readinessState = selectedModelRunnable ? 'ready' : supportBlocked ? 'blocked' : selectedModel ? 'waiting' : 'idle'
  const readinessLabel = selectedModelRunnable
    ? 'Preview chat ready'
    : supportBlocked
      ? 'Support match needed'
      : selectedModel
        ? 'Waiting on model readiness'
        : 'Choose a model to begin'
  const runtimeGateCopy = selectedModel
    ? `loaded_now=${selectedRuntimeReady ? 'true' : 'false'} · generation_ready=${runtime?.generation_ready && runtime?.active_model_id === selectedModelId ? 'true' : 'false'}`
    : 'No model selected'
  const starterPrompts = [
    {
      label: 'Smoke reply',
      prompt: 'Reply with one concise sentence proving the local chat path is awake.',
    },
    {
      label: 'Model summary',
      prompt: 'In one short paragraph, summarize the loaded local model and the support contract Camelid is using.',
    },
    {
      label: 'Guardrail check',
      prompt: 'Explain in plain English why Camelid requires loaded_now, generation_ready, and an exact compatibility row before chat unlocks.',
    },
  ]
  const productHeroTitle = selectedModelRunnable
    ? 'How can Camelid help locally?'
    : supportBlocked
      ? 'This model needs a support match.'
      : 'Local chat, only when ready.'
  const productHeroSummary = selectedModelRunnable
    ? `${selectedModelName} is ready for local prompts. Production throughput, arbitrary templates, and neighboring model rows remain guarded.`
    : supportBlocked
      ? 'Camelid can see this GGUF, but chat stays locked until the support contract matches this exact model and quantization.'
      : 'A clean Gemini-like prompt surface that stays locked until the model is loaded, generation-ready, and support-matched.'
  const productProofCards = [
    {
      label: 'Runtime',
      value: selectedRuntimeReady ? 'Ready' : runtime?.loaded_now ? 'Loaded, gated' : 'Waiting',
      detail: selectedRuntimeReady ? 'Loaded model can generate local replies.' : selectedModel ? runtimeGateCopy : 'No active local model selected.',
      tone: selectedRuntimeReady ? 'ready' : 'waiting',
    },
    {
      label: 'Supported model',
      value: selectedCompatibilitySupported ? 'Matched' : 'Needs match',
      detail: selectedCompatibilitySupported ? 'Model and Q8_0 quantization match the support contract.' : 'No support is inferred from filenames or broad families.',
      tone: selectedCompatibilitySupported ? 'ready' : supportBlocked ? 'blocked' : 'waiting',
    },
    {
      label: 'Reply scope',
      value: 'Context-limited',
      detail: 'Runs until EOS, explicit request max_tokens, or the backend context limit.',
      tone: selectedModelRunnable ? 'ready' : 'waiting',
    },
  ]
  const honestyTitle = selectedModelRunnable
    ? 'Local chat is available'
    : supportBlocked
      ? 'Loaded is not enough'
      : selectedModel
        ? 'Still waiting on readiness'
        : 'Choose a model first'
  const honestyCopy = selectedModelRunnable
    ? `Only ${selectedModelName} in this supported Q8_0 row is unlocked here; broader model support is not implied.`
    : supportBlocked
      ? 'The UI will not turn a visible GGUF path into a support claim without a matching capabilities row.'
      : selectedModel
        ? 'The composer unlocks after the selected model is loaded, generation-ready, and support-matched.'
        : 'Saved paths, filenames, and catalog names do not create support claims by themselves.'

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
                <div className="chat-empty-product-lockup">
                  <div className="chat-empty-orb chat-empty-orb-product" aria-hidden="true">
                    <span>C</span>
                    <i />
                  </div>
                  <div className={`chat-empty-readiness-ribbon chat-empty-readiness-ribbon-compact is-${readinessState}`} aria-label="Current chat readiness">
                    <span className="readiness-ribbon-dot" aria-hidden="true" />
                    <strong>{readinessLabel}</strong>
                    <small>{selectedModel ? selectedModelName : 'No local model selected'}</small>
                  </div>
                </div>
                <div className="chat-empty-superwordmark" aria-hidden="true">Camelid</div>
                <p className="chat-empty-greeting">{emptyHeroEyebrow}</p>
                <h2>{productHeroTitle}</h2>
                <p className="hero-summary">{productHeroSummary}</p>
              </div>

              <div className="chat-empty-proof-grid" aria-label="Visible support and readiness proof">
                {productProofCards.map((card) => (
                  <div key={card.label} className={`chat-empty-proof-card is-${card.tone}`}>
                    <span>{card.label}</span>
                    <strong>{card.value}</strong>
                    <small>{card.detail}</small>
                  </div>
                ))}
              </div>

              <div className="composer composer-gemini composer-gemini-stage composer-gemini-stage-clean composer-gemini-product">
                <textarea className="composer-input composer-input-gemini composer-input-gemini-stage" value={composer} onChange={(e) => setComposer(e.target.value)} onKeyDown={handleComposerKeyDown} rows={2} placeholder={selectedModelRunnable ? 'Message Camelid locally…' : 'Load an exact supported, generation-ready model first'} disabled={sending || !selectedModelRunnable} />
                <div className="composer-gemini-footer composer-gemini-footer-stage composer-gemini-footer-stage-clean">
                  <div className="composer-gemini-tools composer-gemini-tools-stage composer-gemini-tools-stage-clean">
                    {renderModelPicker()}
                    <span className={`composer-meta-pill composer-meta-pill-readiness is-${readinessState}`}>{readinessLabel}</span>
                    {!selectedModelRunnable && hasRunnableChoices && <button className="ghost-button ghost-button-quiet" onClick={() => setTab('library')}>Open Library</button>}
                  </div>
                  <div className="composer-gemini-actions composer-gemini-actions-stage">
                    <button className="primary-button composer-send-button" onClick={sendMessage} disabled={!canSubmit}>{sending ? 'Sending…' : 'Send'}</button>
                  </div>
                </div>
                <div className="composer-gemini-disclaimer composer-gemini-disclaimer-product">
                  <span>Raw local replies run until EOS, explicit request limits, or the backend context window.</span>
                  <button type="button" className="composer-contract-link" onClick={() => setTab('api')}>View support contract</button>
                </div>
              </div>

              <p className={`chat-empty-honesty-note is-${readinessState}`} aria-label="Local chat support boundary">
                <strong>{honestyTitle}.</strong> {honestyCopy}
              </p>

              <div className="chat-starter-chips chat-starter-chips-centered chat-starter-chips-stage" aria-label="Starter prompts">
                {starterPrompts.map((starter) => (
                  <button
                    key={starter.label}
                    type="button"
                    className="chat-starter-chip chat-starter-chip-stage chat-starter-chip-product"
                    onClick={() => setComposer(starter.prompt)}
                    disabled={!selectedModelRunnable || sending}
                    title={selectedModelRunnable ? starter.prompt : 'Starter prompts unlock after a model is ready and supported.'}
                  >
                    {starter.label}
                  </button>
                ))}
              </div>

              <p className="chat-empty-status-note">{selectedModelMeta} · Support is exact-row only.</p>
            </div>
          </div>
        ) : (
          <>
            <div className={`chat-session-strip is-${readinessState}`} aria-label="Current Camelid chat status">
              <span className="chat-session-dot" aria-hidden="true" />
              <strong>{selectedModelName}</strong>
              <small>{selectedModelRunnable ? (staleTelemetryModelLabel ? `Last reply used ${staleTelemetryModelLabel}` : latestCompletionCopy) : readinessLabel}</small>
              <button type="button" className="composer-contract-link" onClick={() => setTab('api')}>Contract</button>
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
                const hasMetrics = message.role === 'assistant' && (message.tokens_in_per_sec !== null && message.tokens_in_per_sec !== undefined || message.tokens_out_per_sec !== null && message.tokens_out_per_sec !== undefined)
                const messageCompletionTokens = message.usage?.completion_tokens
                const modelLabel = message.model_name || message.model_id
                const firstGeneratedToken = message.generated_token_ids?.[0]
                const firstTokenCopy = firstGeneratedToken !== null && firstGeneratedToken !== undefined ? ` First token #${firstGeneratedToken}.` : ''
                const diagnosticCopy = message.role === 'assistant'
                  ? messageCompletionTokens === 1
                    ? `Raw first-token validation sample.${firstTokenCopy}`
                    : messageCompletionTokens
                      ? `Raw local output · ${messageCompletionTokens} completion tokens.${firstTokenCopy}`
                      : 'Raw local output.'
                  : ''
                const messageContent = cleanLegacyDemoCapCopy(message.content)
                const cleanDiagnosticCopy = cleanLegacyDemoCapCopy(diagnosticCopy)

                return (
                  <article key={message.id} className={`message-row message-row-gemini ${message.role}`}>
                    <div className={`message-bubble message-bubble-gemini ${message.role}`}>
                      {message.role === 'assistant' && (
                        <div className="message-heading message-heading-clean">
                          <span className="message-micro-meta">{[modelLabel, hasMetrics ? `${formatRate(message.tokens_out_per_sec)} out` : 'raw local reply'].filter(Boolean).join(' · ')}</span>
                        </div>
                      )}
                      <p>{messageContent}</p>
                      {message.role === 'assistant' && (cleanDiagnosticCopy || hasMetrics) && (
                        <div className="message-footnote">
                          {cleanDiagnosticCopy && <span>{cleanDiagnosticCopy}</span>}
                          {message.tokens_in_per_sec !== null && message.tokens_in_per_sec !== undefined && <span>In {formatRate(message.tokens_in_per_sec)}</span>}
                          {message.tokens_out_per_sec !== null && message.tokens_out_per_sec !== undefined && <span>Out {formatRate(message.tokens_out_per_sec)}</span>}
                        </div>
                      )}
                      {message.role === 'assistant' && message.top_logits?.length > 0 && (
                        <div className="message-logit-viewer" aria-label="Top five first-token probabilities for this reply">
                          <div className="message-logit-title">Top-5 first-token probabilities</div>
                          {message.top_logits.slice(0, 5).map((entry) => (
                            <div key={`${message.id}-${entry.rank}-${entry.token_id}`} className="message-logit-row">
                              <span>#{entry.rank}</span>
                              <code title={`token ${entry.token_id}`}>{entry.text || `#${entry.token_id}`}</code>
                              <strong>{formatProbability(entry.probability)}</strong>
                            </div>
                          ))}
                        </div>
                      )}
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
                        <span className="message-micro-meta">Thinking…</span>
                      </div>
                      <p className="message-placeholder-copy">Generating a raw local reply… first-token diagnostics appear after completion.</p>
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
              <button className="primary-button composer-send-button" onClick={sendMessage} disabled={!canSubmit}>{sending ? 'Sending…' : 'Send'}</button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
