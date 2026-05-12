#!/usr/bin/env node
import assert from 'node:assert/strict'
import { mkdtemp, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'

const repoRoot = process.cwd()

const help = spawnSync(process.execPath, ['scripts/prepare-full-support-bundle.mjs', '--help'], {
  cwd: repoRoot,
  encoding: 'utf8',
})
assert.equal(help.status, 0, help.stderr || help.stdout)
assert.match(help.stdout, /default: blocked_by_operator_shutdown/)

const blockedRoot = await mkdtemp(join(tmpdir(), 'camelid-full-support-blocked-'))
const blockedOut = join(blockedRoot, 'bundle')
const blocked = spawnSync(process.execPath, ['scripts/prepare-full-support-bundle.mjs', '--out-dir', blockedOut], {
  cwd: repoRoot,
  encoding: 'utf8',
})
assert.equal(blocked.status, 0, blocked.stderr || blocked.stdout)

const blockedManifest = JSON.parse(await readFile(join(blockedOut, 'manifest.json'), 'utf8'))
assert.equal(blockedManifest.validation_host_status.status, 'blocked_by_operator_shutdown')
assert.equal(blockedManifest.validation_host_status.runtime_validation_available, false)
assert.equal(
  blockedManifest.carry_forward_public_refs.validation_note,
  'qa/validation-notes/2026-05-12-local-only-validation-lane-paused.md',
)
assert.ok(blockedManifest.validation_host_status.blocked_rows.length >= 4)

const blockedReadme = await readFile(join(blockedOut, 'README.md'), 'utf8')
assert.match(blockedReadme, /Runtime validation available: `false`/)
assert.match(blockedReadme, /do not substitute local Mac llama-server\/reference workloads/)

const blockedRuntimeScript = await readFile(
  join(blockedOut, 'llama3_8b_instruct_q8_0', 'commands', '01-compact-parity.sh'),
  'utf8',
)
assert.match(blockedRuntimeScript, /Camelid runtime validation is blocked/)
assert.match(blockedRuntimeScript, /exit 86/)

const availableRoot = await mkdtemp(join(tmpdir(), 'camelid-full-support-available-'))
const availableOut = join(availableRoot, 'bundle')
const available = spawnSync(
  process.execPath,
  ['scripts/prepare-full-support-bundle.mjs', '--validation-host-status', 'available', '--out-dir', availableOut],
  { cwd: repoRoot, encoding: 'utf8' },
)
assert.equal(available.status, 0, available.stderr || available.stdout)

const availableManifest = JSON.parse(await readFile(join(availableOut, 'manifest.json'), 'utf8'))
assert.equal(availableManifest.validation_host_status.status, 'available')
assert.equal(availableManifest.validation_host_status.runtime_validation_available, true)

const availableRuntimeScript = await readFile(
  join(availableOut, 'llama3_8b_instruct_q8_0', 'commands', '01-compact-parity.sh'),
  'utf8',
)
assert.doesNotMatch(availableRuntimeScript, /Camelid runtime validation is blocked/)
assert.doesNotMatch(availableRuntimeScript, /exit 86/)

const invalid = spawnSync(
  process.execPath,
  ['scripts/prepare-full-support-bundle.mjs', '--validation-host-status', 'maybe', '--out-dir', join(availableRoot, 'invalid')],
  { cwd: repoRoot, encoding: 'utf8' },
)
assert.equal(invalid.status, 2)
assert.match(invalid.stderr, /unknown --validation-host-status/)
