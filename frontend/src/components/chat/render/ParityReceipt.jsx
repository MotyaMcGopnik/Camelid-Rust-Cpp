import { useState } from 'react'
import { copyText } from '../../../lib/markdown'

/* Parity receipt card — extracted verbatim from ChatWorkspace.
   Copy rule (mirrors the release ledger boundary): the card may say a match was
   verified for THIS request, and must never imply the lane itself is supported. */

const downloadJson = (filename, value) => {
  try {
    const blob = new Blob([`${JSON.stringify(value, null, 2)}\n`], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = filename
    anchor.click()
    URL.revokeObjectURL(url)
  } catch {
    // Download is best-effort outside full browser contexts.
  }
}

export function ParityReceiptCard({ receipt }) {
  const [copiedCommand, setCopiedCommand] = useState(false)
  const [copiedId, setCopiedId] = useState(false)
  if (!receipt?.receipt_id) return null
  const lane = receipt.lane || {}
  const parity = receipt.parity || {}
  const shortHash = String(lane.gguf_sha256 || '').slice(0, 12)
  const shortId = String(receipt.receipt_id || '').slice(0, 12)
  const downloadName = `camelid-parity-receipt-${shortId}.json`
  const verifyCommand = `camelid verify-receipt ${downloadName} --gguf <path-to-${lane.gguf_filename || 'model.gguf'}>`
  const compared = parity.compared_against_reference === true
  const allMatch = compared
    && parity.prompt_tokens_match === true
    && parity.generated_tokens_match === true
    && parity.generated_text_match === true
  const matchMark = (value) => (value === true ? '✓' : value === false ? '✗' : '—')
  const statusLabel = !receipt.reproducible
    ? 'Not reproducible (sampled) — not verifiable'
    : compared
      ? (allMatch ? 'Verified match for this request' : 'Divergence recorded for this request')
      : 'Unverified claim — check it with the CLI'
  const statusTone = !receipt.reproducible ? 'sampled' : compared ? (allMatch ? 'match' : 'diverged') : 'claim'

  const handleCopyCommand = async () => {
    await copyText(verifyCommand)
    setCopiedCommand(true)
    window.setTimeout(() => setCopiedCommand(false), 1600)
  }
  const handleCopyId = async () => {
    await copyText(receipt.receipt_id)
    setCopiedId(true)
    window.setTimeout(() => setCopiedId(false), 1600)
  }

  return (
    <div className="parity-receipt-card" aria-label="Parity receipt for this request">
      <div className="parity-receipt-header">
        <span className="parity-receipt-title">Parity receipt</span>
        <span className={`parity-receipt-badge is-${receipt.reproducible ? 'reproducible' : 'sampled'}`}>
          {receipt.reproducible ? 'Reproducible (greedy)' : 'Not reproducible (sampled)'}
        </span>
      </div>
      <div className="parity-receipt-lane">
        {lane.model_id || 'unknown-lane'} · {lane.quantization || '?'} · gguf:{shortHash || '?'}
      </div>
      <div className={`parity-receipt-status is-${statusTone}`}>{statusLabel}</div>
      {compared && (
        <ul className="parity-receipt-matches">
          <li>prompt tokens {matchMark(parity.prompt_tokens_match)}</li>
          <li>generated tokens {matchMark(parity.generated_tokens_match)}</li>
          <li>generated text {matchMark(parity.generated_text_match)}</li>
          <li>first divergent token index: {parity.first_divergent_token_index ?? '—'}</li>
        </ul>
      )}
      <div className="parity-receipt-id" title={receipt.receipt_id}>
        <span>receipt_id {shortId}…</span>
        <button type="button" className="message-action-button" onClick={handleCopyId}>
          {copiedId ? 'Copied' : 'Copy id'}
        </button>
      </div>
      <div className="parity-receipt-actions">
        <button type="button" className="message-action-button" onClick={() => downloadJson(downloadName, receipt)}>
          Download receipt
        </button>
        <button type="button" className="message-action-button" onClick={handleCopyCommand}>
          {copiedCommand ? 'Copied' : 'Copy verify command'}
        </button>
      </div>
      <p className="parity-receipt-note">
        Records this one request on this exact GGUF. Not a support claim; the release ledger is unchanged.
      </p>
    </div>
  )
}
