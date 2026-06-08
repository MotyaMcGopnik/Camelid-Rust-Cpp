import { memo, useEffect, useLayoutEffect, useRef } from 'react'

/* Assistant markdown + fenced-code rendering.
   Extracted verbatim from the original ChatWorkspace so the parsing/rendering
   behavior (and the markup the CI smokes assert on) is preserved exactly. */

export const normalizeCodeLanguage = (value) => {
  const language = String(value || '').trim().replace(/[^a-zA-Z0-9_+#.-].*$/, '')
  if (!language) return 'Code'
  if (language.toLowerCase() === 'js') return 'JavaScript'
  if (language.toLowerCase() === 'ts') return 'TypeScript'
  if (language.toLowerCase() === 'html') return 'HTML'
  if (language.toLowerCase() === 'css') return 'CSS'
  return language.toUpperCase()
}

export const copyText = async (text) => {
  try {
    await navigator.clipboard?.writeText(text)
  } catch {
    // Clipboard access can be denied outside secure browser contexts; rendering still works.
  }
}

const renderInlineMarkdown = (text, keyPrefix) => {
  const parts = String(text || '').split(/(`[^`]+`|\*\*[^*]+\*\*)/g).filter(Boolean)
  return parts.map((part, index) => {
    const key = `${keyPrefix}-${index}`
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={key} className="inline-code">{part.slice(1, -1)}</code>
    }
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={key}>{part.slice(2, -2)}</strong>
    }
    return <span key={key}>{part}</span>
  })
}

const normalizeProseForReading = (text) => String(text || '')
  .replace(/\r\n/g, '\n')
  .replace(/\s+(Page\s+\d+\b)/gi, '\n\n$1')
  .replace(/\s+(References?\s*:)/gi, '\n\n$1')
  .replace(/\s+(Works\s+Cited\s*:)/gi, '\n\n$1')
  .replace(/\s+([•*-]\s+["“])/g, '\n$1')

const splitLongParagraph = (value) => {
  const text = String(value || '').trim()
  if (text.length <= 520) return text ? [text] : []
  const sentences = text.match(/[^.!?]+[.!?]+["”']?|[^.!?]+$/g) || [text]
  const paragraphs = []
  let current = ''

  sentences.forEach((sentence) => {
    const next = `${current}${current ? ' ' : ''}${sentence.trim()}`.trim()
    if (current && (next.length > 620 || current.split(/[.!?]+/).filter(Boolean).length >= 4)) {
      paragraphs.push(current)
      current = sentence.trim()
    } else {
      current = next
    }
  })
  if (current) paragraphs.push(current)
  return paragraphs
}

const pushParagraphBlocks = (blocks, value, keyPrefix) => {
  splitLongParagraph(value).forEach((paragraph) => {
    blocks.push(<p key={`${keyPrefix}-p-${blocks.length}`}>{renderInlineMarkdown(paragraph, `${keyPrefix}-p-${blocks.length}`)}</p>)
  })
}

const renderMarkdownText = (text, keyPrefix) => {
  const lines = normalizeProseForReading(text).split('\n')
  const blocks = []
  let paragraph = []
  let list = []

  const flushParagraph = () => {
    if (paragraph.length) {
      const value = paragraph.join(' ').trim()
      if (value) {
        pushParagraphBlocks(blocks, value, keyPrefix)
      }
      paragraph = []
    }
  }
  const flushList = () => {
    if (list.length) {
      blocks.push(
        <ul key={`${keyPrefix}-ul-${blocks.length}`}>
          {list.map((item, index) => (
            <li key={`${keyPrefix}-li-${blocks.length}-${index}`}>{renderInlineMarkdown(item, `${keyPrefix}-li-${index}`)}</li>
          ))}
        </ul>,
      )
      list = []
    }
  }

  lines.forEach((rawLine) => {
    const line = rawLine.trim()
    if (!line) {
      flushParagraph()
      flushList()
      return
    }
    const heading = line.match(/^(#{1,3})\s+(.+)$/)
    if (heading) {
      flushParagraph()
      flushList()
      const Tag = heading[1].length === 1 ? 'h2' : 'h3'
      blocks.push(<Tag key={`${keyPrefix}-h-${blocks.length}`}>{renderInlineMarkdown(heading[2], `${keyPrefix}-h-${blocks.length}`)}</Tag>)
      return
    }
    const pageHeading = line.match(/^(Page\s+\d+)\b[:\s.-]*(.*)$/i)
    if (pageHeading) {
      flushParagraph()
      flushList()
      blocks.push(<h3 className="message-section-heading" key={`${keyPrefix}-page-${blocks.length}`}>{pageHeading[1]}</h3>)
      if (pageHeading[2]) {
        pushParagraphBlocks(blocks, pageHeading[2], keyPrefix)
      }
      return
    }
    const referencesHeading = line.match(/^(References?|Works\s+Cited)\s*:?(.*)$/i)
    if (referencesHeading) {
      flushParagraph()
      flushList()
      blocks.push(<h3 className="message-section-heading" key={`${keyPrefix}-ref-${blocks.length}`}>{referencesHeading[1]}</h3>)
      if (referencesHeading[2]) {
        pushParagraphBlocks(blocks, referencesHeading[2].replace(/^\s*[:*-]\s*/, ''), keyPrefix)
      }
      return
    }
    const listItem = line.match(/^[-*]\s+(.+)$/)
    if (listItem) {
      flushParagraph()
      list.push(listItem[1])
      return
    }
    flushList()
    paragraph.push(line)
  })
  flushParagraph()
  flushList()
  return blocks
}

const syntaxClassForToken = (token, language) => {
  const lowerLanguage = String(language || '').toLowerCase()
  if (/^\s+$/.test(token)) return ''
  if (/^\/\//.test(token) || /^\/\*/.test(token) || /^<!--/.test(token)) return 'comment'
  if (/^['"`]/.test(token)) return 'string'
  if (/^\d/.test(token)) return 'number'
  if (lowerLanguage.includes('html') && /^<\/?[\w-]+/.test(token)) return 'tag'
  if (lowerLanguage.includes('html') && /^[\w:-]+(?==)/.test(token)) return 'attr'
  if (/^(const|let|var|function|return|if|else|for|while|class|new|true|false|null|undefined|import|export|from|async|await|document|window)$/.test(token)) return 'keyword'
  if (lowerLanguage.includes('css') && /^[\w-]+(?=\s*:)/.test(token)) return 'attr'
  return ''
}

const renderHighlightedCode = (code, language, keyPrefix) => {
  const lowerLanguage = String(language || '').toLowerCase()
  const pattern = lowerLanguage.includes('html')
    ? /(<!--[\s\S]*?-->|<\/?[\w-]+|\/?>|[\w:-]+(?==)|"(?:\\.|[^"])*"|'(?:\\.|[^'])*')/g
    : lowerLanguage.includes('css')
      ? /(\/\*[\s\S]*?\*\/|"(?:\\.|[^"])*"|'(?:\\.|[^'])*'|#[\da-fA-F]{3,8}|\b\d+(?:\.\d+)?(?:px|rem|em|%|vh|vw)?\b|[\w-]+(?=\s*:))/g
      : /(\/\/.*|\/\*[\s\S]*?\*\/|"(?:\\.|[^"])*"|'(?:\\.|[^'])*'|`(?:\\.|[^`])*`|\b(?:const|let|var|function|return|if|else|for|while|class|new|true|false|null|undefined|import|export|from|async|await|document|window)\b|\b\d+(?:\.\d+)?\b)/g
  const nodes = []
  let cursor = 0
  let match = pattern.exec(code)
  while (match) {
    if (match.index > cursor) nodes.push(code.slice(cursor, match.index))
    const token = match[0]
    const tokenClass = syntaxClassForToken(token, lowerLanguage)
    nodes.push(tokenClass
      ? <span key={`${keyPrefix}-${nodes.length}`} className={`syntax-token ${tokenClass}`}>{token}</span>
      : token)
    cursor = match.index + token.length
    match = pattern.exec(code)
  }
  if (cursor < code.length) nodes.push(code.slice(cursor))
  return nodes
}

const splitFenceInfo = (value) => {
  const trimmed = String(value || '').trim()
  if (!trimmed) return { language: 'Code', firstCodeLine: '' }
  const [, rawLanguage = '', firstCodeLine = ''] = trimmed.match(/^([a-zA-Z0-9_+#.-]+)?\s*([\s\S]*)$/) || []
  return {
    language: normalizeCodeLanguage(rawLanguage),
    firstCodeLine: firstCodeLine.trimStart(),
  }
}

export const CODE_CARD_STREAMING_LABEL = 'Still generating — code block incomplete'

export function CodeBlockCard({ language, code, keyPrefix, stillGenerating }) {
  const preRef = useRef(null)
  const autoFollowCodeRef = useRef(true)

  useEffect(() => {
    if (!stillGenerating) return undefined
    autoFollowCodeRef.current = true
    const pre = preRef.current
    if (!pre) return undefined
    const updateAutoFollow = () => {
      const distanceFromBottom = pre.scrollHeight - (pre.scrollTop + pre.clientHeight)
      autoFollowCodeRef.current = distanceFromBottom < 80
    }
    pre.addEventListener('scroll', updateAutoFollow, { passive: true })
    return () => pre.removeEventListener('scroll', updateAutoFollow)
  }, [stillGenerating])

  useLayoutEffect(() => {
    if (!stillGenerating || !autoFollowCodeRef.current) return
    const pre = preRef.current
    if (pre) pre.scrollTop = pre.scrollHeight
  }, [code, stillGenerating])

  return (
    <figure
      className={`message-code-card ${stillGenerating ? 'is-generating' : ''}`}
      aria-busy={stillGenerating ? 'true' : undefined}
      data-code-streaming-state={stillGenerating ? 'open' : undefined}
    >
      <figcaption>
        <span className="message-code-card-title">{language}</span>
        {stillGenerating && <span className="message-code-card-status" aria-live="polite" data-live-status="active">{CODE_CARD_STREAMING_LABEL}</span>}
        <button type="button" onClick={() => copyText(code)} aria-label={`Copy ${language} code`}>Copy</button>
      </figcaption>
      <pre ref={preRef}><code>{renderHighlightedCode(code, language, keyPrefix)}</code></pre>
    </figure>
  )
}

const pushCodeBlock = (blocks, language, code, keyPrefix, { incomplete = false, streaming = false } = {}) => {
  const trimmedCode = String(code || '').replace(/^\n+|\n+$/g, '')
  const stillGenerating = Boolean(incomplete && streaming)
  blocks.push(
    <CodeBlockCard
      key={`code-${blocks.length}`}
      language={language}
      code={trimmedCode}
      keyPrefix={keyPrefix}
      stillGenerating={stillGenerating}
    />,
  )
}

export const hasOpenCodeFence = (content) => {
  const matches = String(content || '').match(/```/g)
  return Boolean(matches && matches.length % 2 === 1)
}

function AssistantMarkdownInner({ content, streaming = false }) {
  const normalized = String(content || '').replace(/\r\n/g, '\n')
  const blocks = []
  let cursor = 0
  let fenceStart = normalized.indexOf('```', cursor)

  while (fenceStart !== -1) {
    const before = normalized.slice(cursor, fenceStart)
    blocks.push(...renderMarkdownText(before, `md-${blocks.length}`))

    const infoStart = fenceStart + 3
    const nextLine = normalized.indexOf('\n', infoStart)
    const infoEnd = nextLine === -1 ? normalized.length : nextLine
    const { language, firstCodeLine } = splitFenceInfo(normalized.slice(infoStart, infoEnd))
    const codeStart = nextLine === -1 ? infoEnd : nextLine + 1
    const fenceEnd = normalized.indexOf('```', codeStart)
    const incompleteFence = fenceEnd === -1
    const codeEnd = fenceEnd === -1 ? normalized.length : fenceEnd
    const codeBody = normalized.slice(codeStart, codeEnd)
    const code = firstCodeLine ? `${firstCodeLine}${codeBody ? `\n${codeBody}` : ''}` : codeBody

    pushCodeBlock(blocks, language, code, `code-${blocks.length}`, { incomplete: incompleteFence, streaming })
    cursor = fenceEnd === -1 ? normalized.length : fenceEnd + 3
    fenceStart = normalized.indexOf('```', cursor)
  }
  blocks.push(...renderMarkdownText(normalized.slice(cursor), `md-${blocks.length}`))

  return <div className="message-markdown">{blocks.length ? blocks : <p>{content}</p>}</div>
}

export const AssistantMarkdown = memo(AssistantMarkdownInner)
