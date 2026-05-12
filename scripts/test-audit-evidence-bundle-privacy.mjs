#!/usr/bin/env node
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const tempRoot = await mkdtemp(join(tmpdir(), 'camelid-evidence-privacy-'))
const safeRoot = join(tempRoot, 'safe')
const leakRoot = join(tempRoot, 'leak')

await mkdir(join(safeRoot, 'llama32-3b-local-smoke'), { recursive: true })
await writeFile(
  join(safeRoot, 'llama32-3b-local-smoke', 'summary.json'),
  `${JSON.stringify(
    {
      schema: 'camelid.local_smoke.v1',
      host: 'local-only mac smoke',
      model_path: '$CAMELID_MODEL_DIR/Llama-3.2-3B-Instruct-Q8_0.gguf',
      health_endpoint: '127.0.0.1',
    },
    null,
    2,
  )}\n`,
)

await mkdir(join(leakRoot, 'llama32-3b-local-smoke'), { recursive: true })
await writeFile(
  join(leakRoot, 'llama32-3b-local-smoke', 'summary.json'),
  `${JSON.stringify(
    {
      schema: 'camelid.local_smoke.v1',
      host: 'local-only mac smoke',
      model_path: '/Volumes/SSK Drive/Camelid/models/llama-3.2-3b-instruct/Llama-3.2-3B-Instruct-Q8_0.gguf',
    },
    null,
    2,
  )}\n`,
)

const safe = spawnAudit(safeRoot)
assert.equal(safe.status, 0, safe.stderr || safe.stdout)
const safeReport = JSON.parse(safe.stdout)
assert.equal(safeReport.finding_count, 0)

const leaked = spawnAudit(leakRoot)
assert.notEqual(leaked.status, 0, 'mounted-volume paths in evidence bundles must fail strict privacy audit')
const leakedReport = JSON.parse(leaked.stdout)
assert.equal(leakedReport.finding_count, 1)
assert.equal(leakedReport.bundles[0].findings[0].pattern, 'mac_mounted_volume_path')
assert.match(leakedReport.bundles[0].findings[0].sample, /Llama-3\.2-3B-Instruct-Q8_0\.gguf/)

function spawnAudit(root) {
  return spawnSync(process.execPath, ['scripts/audit-evidence-bundle-privacy.mjs', '--root', root, '--strict'], {
    cwd: process.cwd(),
    encoding: 'utf8',
  })
}
