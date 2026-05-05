#!/usr/bin/env node
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'

const tempRoot = await mkdtemp(join(tmpdir(), 'camelid-evidence-claims-'))
const goodRoot = join(tempRoot, 'good')
const badRoot = join(tempRoot, 'bad')

await writeBundle(goodRoot, { mutate: false })
await writeBundle(badRoot, { mutate: true })

const good = spawnSync(process.execPath, ['scripts/check-public-evidence-claims.mjs', '--root', goodRoot], {
  cwd: process.cwd(),
  encoding: 'utf8',
})
assert.equal(good.status, 0, good.stderr || good.stdout)
assert.match(good.stdout, /public evidence claim check passed/)

const bad = spawnSync(process.execPath, ['scripts/check-public-evidence-claims.mjs', '--root', badRoot], {
  cwd: process.cwd(),
  encoding: 'utf8',
})
assert.notEqual(bad.status, 0, 'invalid context-512 evidence should fail')
assert.match(bad.stderr, /generated_tokens_match must be true/)

async function writeBundle(root, { mutate }) {
  const dir = join(root, 'four-row-context-512-test')
  await mkdir(dir, { recursive: true })
  const boundary = 'Closes only the first bounded 512-context pack. It does not promote neighboring rows, other quantizations, larger contexts, broader chat-template behavior, or full Llama-family support.'
  const rows = [
    row('tinyllama_1_1b_chat_q8_0', 291),
    row('llama32_1b_instruct_q8_0', 245),
    row('llama32_3b_instruct_q8_0', 245),
    row('llama3_8b_instruct_q8_0', 245),
  ]
  if (mutate) rows[3].generated_tokens_match = false
  const manifest = {
    schema: 'camelid.four_row_context_512_public_evidence.v1',
    passed: true,
    checkout_clean: true,
    pack: {
      target_context_window: 512,
      max_tokens: 5,
      source_prompt_pack: 'qa/prompt-packs/llama3-context-512-smoke.json',
    },
    rows,
    claim_boundary: boundary,
  }
  const summary = {
    schema: 'camelid.four_row_context_512_public_summary.v1',
    passed: true,
    checks: {
      checkout_clean: true,
      prompt_tokens_all_match: true,
      generated_tokens_all_match: true,
      generated_text_all_match: true,
      all_rows_have_bounded_rss: true,
    },
    rows: rows.map((item) => ({
      row_id: item.row_id,
      context_window: item.context_window,
      reference_prompt_token_count: item.reference_prompt_token_count,
      max_tokens: item.max_tokens,
      max_resident_set_kib: item.max_resident_set_kib,
      passed: item.prompt_tokens_match && item.generated_tokens_match && item.generated_text_match,
    })),
    claim_boundary: boundary,
  }
  await writeFile(join(dir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`)
  await writeFile(join(dir, 'summary.json'), `${JSON.stringify(summary, null, 2)}\n`)
}

function row(rowId, tokenCount) {
  return {
    row_id: rowId,
    context_window: 512,
    max_tokens: 5,
    reference_prompt_token_count: tokenCount,
    prompt_tokens_match: true,
    generated_tokens_match: true,
    generated_text_match: true,
    first_generated_token_diff_index: -1,
    max_resident_set_kib: 1024,
    model_sha256: 'a'.repeat(64),
    raw_artifact: `target/${rowId}/summary.json`,
  }
}
