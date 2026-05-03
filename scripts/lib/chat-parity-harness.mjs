export const SUPPORTED_RENDER_MODES = ['compact', 'tinyllama-marker']
export const SUPPORTED_PROMPT_PACK_SCHEMAS = [
  'camelid.llama3.prompt-pack.v1',
  'camelid.tinyllama.prompt-pack.v1',
]

export function renderExpectedPrompt(messages, renderMode) {
  if (!Array.isArray(messages) || messages.length === 0) {
    throw new Error('messages must contain at least one entry')
  }
  switch (renderMode) {
    case 'compact':
      return renderCompactLlama3Prompt(messages)
    case 'tinyllama-marker':
      return renderTinyLlamaMarkerPrompt(messages)
    default:
      throw new Error(`unsupported --render-mode ${JSON.stringify(renderMode)}; supported modes: ${SUPPORTED_RENDER_MODES.join(', ')}`)
  }
}

export function normalizePromptPack(pack, { packPath = 'prompt pack' } = {}) {
  if (!pack || typeof pack !== 'object' || Array.isArray(pack)) {
    throw new Error(`${packPath} must be a JSON object`)
  }
  const schema = requireString(pack.schema, `${packPath}.schema`)
  if (!SUPPORTED_PROMPT_PACK_SCHEMAS.includes(schema)) {
    throw new Error(`${packPath}.schema ${JSON.stringify(schema)} is unsupported; supported schemas: ${SUPPORTED_PROMPT_PACK_SCHEMAS.join(', ')}`)
  }
  const packId = requireString(pack.pack_id, `${packPath}.pack_id`)
  const defaultMaxTokens = parsePositiveInt(pack.defaults?.max_tokens ?? 50, `${packPath}.defaults.max_tokens`)
  const defaultRenderMode = normalizeRenderMode(pack.defaults?.render_mode ?? 'compact', `${packPath}.defaults.render_mode`)
  const targetContextWindow = parseOptionalPositiveInt(pack.target_context_window, `${packPath}.target_context_window`)
  const prompts = Array.isArray(pack.prompts) ? pack.prompts : []
  if (prompts.length === 0) {
    throw new Error(`${packPath}.prompts must contain at least one entry`)
  }

  return {
    schema,
    pack_id: packId,
    description: typeof pack.description === 'string' ? pack.description : null,
    defaults: {
      max_tokens: defaultMaxTokens,
      render_mode: defaultRenderMode,
    },
    target_context_window: targetContextWindow,
    prompts: prompts.map((prompt, index) => normalizePrompt(prompt, {
      packPath,
      index,
      defaultMaxTokens,
      defaultRenderMode,
      packTargetContextWindow: targetContextWindow,
    })),
  }
}

export function resolveReferenceContext({ promptTokenCount, maxTokens, explicitContext = null, minimumContext = 512, headroom = 16 }) {
  const required = promptTokenCount + maxTokens + headroom
  if (Number.isInteger(explicitContext) && explicitContext > 0) {
    if (explicitContext < required) {
      throw new Error(`--llama-context ${explicitContext} is too small for ${promptTokenCount} prompt tokens + ${maxTokens} generated tokens + ${headroom} token headroom`)
    }
    return explicitContext
  }
  return Math.max(minimumContext, required)
}

function normalizePrompt(prompt, { packPath, index, defaultMaxTokens, defaultRenderMode, packTargetContextWindow }) {
  if (!prompt || typeof prompt !== 'object' || Array.isArray(prompt)) {
    throw new Error(`${packPath}.prompts[${index}] must be an object`)
  }
  const hasMessages = Array.isArray(prompt.messages)
  const hasMessage = Object.prototype.hasOwnProperty.call(prompt, 'message')
  if (!hasMessages && !hasMessage) {
    throw new Error(`${packPath}.prompts[${index}] must include either message or messages`)
  }
  const renderMode = normalizeRenderMode(prompt.render_mode ?? defaultRenderMode, `${packPath}.prompts[${index}].render_mode`)
  return {
    id: typeof prompt.id === 'string' && prompt.id.trim() ? prompt.id.trim() : `p${index + 1}`,
    note: typeof prompt.note === 'string' ? prompt.note : null,
    message: hasMessages ? null : String(prompt.message ?? ''),
    messages: hasMessages ? prompt.messages : null,
    max_tokens: parsePositiveInt(prompt.max_tokens ?? defaultMaxTokens, `${packPath}.prompts[${index}].max_tokens`),
    render_mode: renderMode,
    target_context_window: parseOptionalPositiveInt(
      prompt.target_context_window ?? packTargetContextWindow,
      `${packPath}.prompts[${index}].target_context_window`,
    ),
  }
}

function normalizeRenderMode(renderMode, pathLabel) {
  const normalized = String(renderMode)
  if (!SUPPORTED_RENDER_MODES.includes(normalized)) {
    throw new Error(`${pathLabel} ${JSON.stringify(normalized)} is unsupported; supported render modes: ${SUPPORTED_RENDER_MODES.join(', ')}`)
  }
  return normalized
}

function parsePositiveInt(value, pathLabel) {
  const parsed = Number.parseInt(String(value), 10)
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error(`${pathLabel} must be a positive integer, got ${value}`)
  }
  return parsed
}

function parseOptionalPositiveInt(value, pathLabel) {
  if (value === undefined || value === null || value === '') return null
  return parsePositiveInt(value, pathLabel)
}

function requireString(value, pathLabel) {
  const normalized = typeof value === 'string' ? value.trim() : ''
  if (!normalized) {
    throw new Error(`${pathLabel} must be a non-empty string`)
  }
  return normalized
}

function renderCompactLlama3Prompt(messages) {
  let prompt = ''
  for (const message of messages) {
    prompt += `<|start_header_id|>${message.role.trim()}<|end_header_id|>\n\n${message.content}<|eot_id|>`
  }
  if (messages.at(-1)?.role.trim() !== 'assistant') {
    prompt += '<|start_header_id|>assistant<|end_header_id|>\n\n'
  }
  return prompt
}

function renderTinyLlamaMarkerPrompt(messages) {
  let prompt = ''
  for (const message of messages) {
    prompt += `<|${message.role.trim()}|>\n${message.content}</s>\n`
  }
  if (messages.at(-1)?.role.trim() !== 'assistant') {
    prompt += '<|assistant|>\n'
  }
  return prompt
}
