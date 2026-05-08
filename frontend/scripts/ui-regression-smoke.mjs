#!/usr/bin/env node
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import {
  NEW_CHAT_SENTINEL,
  resolveSelectedConversation,
  shouldCreateConversationForSend,
} from '../src/lib/chatState.js'

const oldChat = { id: 'old-chat', title: 'Old chat', messages: [{ role: 'user', content: 'old prompt' }] }
const newerChat = { id: 'newer-chat', title: 'Newer chat', messages: [{ role: 'user', content: 'newer prompt' }] }
const conversations = [newerChat, oldChat]

assert.equal(resolveSelectedConversation(conversations, NEW_CHAT_SENTINEL), null, 'new-chat sentinel must render an empty landing, not the newest old chat')
assert.equal(resolveSelectedConversation(conversations, null), null, 'null selection must not silently fall back to an old chat')
assert.equal(resolveSelectedConversation(conversations, 'missing-chat'), null, 'missing selection must not silently fall back to an old chat')
assert.equal(resolveSelectedConversation(conversations, 'old-chat'), oldChat, 'explicit old-chat selection should still open that chat')
assert.equal(shouldCreateConversationForSend(null, NEW_CHAT_SENTINEL), true, 'sending from new-chat landing should create a fresh conversation')
assert.equal(shouldCreateConversationForSend(oldChat, NEW_CHAT_SENTINEL), true, 'the sentinel must win even if a stale selectedConversation prop exists')
assert.equal(shouldCreateConversationForSend(oldChat, 'old-chat'), false, 'sending from an explicit existing chat should append to that chat')

const readmeSource = readFileSync(new URL('../../README.md', import.meta.url), 'utf8')
assert.match(readmeSource, /docs\/assets\/camelid-readme-chat-surface-dark\.png/, 'README should use the approved dark collapsed-rail chat screenshot')
assert.doesNotMatch(readmeSource, /docs\/assets\/ui-screenshot-v2\.png/, 'README must not regress to the retired light screenshot')
assert.match(readmeSource, /dark, collapsed-rail chat surface/i, 'README caption should preserve the dark screenshot contract')

const chatWorkspaceSource = readFileSync(new URL('../src/views/ChatWorkspace.jsx', import.meta.url), 'utf8')
const dashboardHookSource = readFileSync(new URL('../src/hooks/useDashboardData.js', import.meta.url), 'utf8')
assert.match(chatWorkspaceSource, /pending is-streaming/, 'pending assistant row should use the same streaming Pac-Man state as live token rows')
assert.match(chatWorkspaceSource, /splitFenceInfo/, 'streaming/incomplete fenced code blocks should be parsed as code instead of prose')
assert.match(chatWorkspaceSource, /pushCodeBlock/, 'code block rendering should stay centralized for complete and incomplete fences')
assert.match(chatWorkspaceSource, /streaming=\{Boolean\(message\.streaming\)\}/, 'assistant markdown should know when a row is still streaming')
assert.match(chatWorkspaceSource, /incomplete:\s*incompleteFence,\s*streaming/, 'unclosed streaming fences should reach the code-card renderer as active incomplete code')
assert.match(chatWorkspaceSource, /aria-busy=\{stillGenerating \? 'true' : undefined\}/, 'incomplete streaming code cards should expose busy state')
assert.match(chatWorkspaceSource, /hasOpenCodeFence/, 'streaming rows should detect open fenced code so the active state can call that out')
assert.match(chatWorkspaceSource, /function StreamingStatus[\s\S]*Still generating — response is active/, 'live assistant rows should keep an explicit still-generating status while the backend is active')
assert.match(chatWorkspaceSource, /Still generating — code block is still open/, 'streaming open code fences should visibly say the code block is still incomplete')
assert.match(chatWorkspaceSource, /assistantStreaming && <StreamingStatus/, 'token-streaming assistant rows should render the active status badge before streamed content')
assert.match(chatWorkspaceSource, /Still generating; waiting for the first token/, 'pre-token pending rows should visibly say the backend is still generating')
assert.match(chatWorkspaceSource, /hasStreamingAssistant[\s\S]*generationActive/, 'a persisted streaming row should keep the UI active even if the send call state changes')
assert.match(chatWorkspaceSource, /message-code-card-status[^>]*>Still generating</, 'incomplete streaming code blocks should show a still-generating badge')
assert.match(dashboardHookSource, /finish_reason:\s*'error',[\s\S]*streaming:\s*false/, 'failed generations should clear streaming state instead of leaving active pellets/status forever')
assert.doesNotMatch(chatWorkspaceSource, /\b(OpenAI|ChatGPT|Claude|Gemini)\b/, 'Chat visible copy should not mention competitor brands')
assert.doesNotMatch(chatWorkspaceSource, /max[-_\s]?tokens?|token\s+limit/i, 'Chat UI should not expose a visible max-token picker or cap')

const componentCss = readFileSync(new URL('../src/styles/components.css', import.meta.url), 'utf8')
assert.match(componentCss, /assistant\.is-streaming::before\s*{[^}]*camelid-pacman-chomp/s, 'Pac-Man should chomp while streaming')
assert.match(componentCss, /assistant\.is-streaming::after\s*{[^}]*camelid-pellets-feed/s, 'pellets should only appear on streaming assistant rows')
assert.match(componentCss, /assistant:not\(\.is-streaming\)::before\s*{[^}]*animation:\s*none/s, 'completed assistant rows should explicitly keep Pac-Man non-animated')
assert.match(componentCss, /assistant:not\(\.is-streaming\)::after\s*{[^}]*content:\s*none[^}]*animation:\s*none/s, 'completed assistant rows should explicitly suppress pellet pseudo-content and animation')
assert.match(componentCss, /\.message-live-status\s*{[^}]*border-radius:\s*999px/s, 'streaming assistant rows should have a compact visible active badge')
assert.match(componentCss, /\.message-live-status-compact\s*{[^}]*margin-top:\s*0[^}]*margin-bottom:\s*12px/s, 'active badges should sit above streamed content instead of hiding below partial code')
assert.match(componentCss, /\.message-code-card\.is-generating\s*{/, 'incomplete streaming code cards should have an active visual treatment')
const pacmanRule = componentCss.match(/\/\* Tiny Pac-Man assistant marker[\s\S]*?\.message-row-gemini\.assistant\.is-streaming::before/s)?.[0] || ''
assert.match(pacmanRule, /width:\s*14px/, 'Pac-Man should stay small')
assert.match(pacmanRule, /height:\s*14px/, 'Pac-Man should stay small')
assert.match(pacmanRule, /transform:\s*none/, 'Pac-Man should not bob or float')
const streamingPelletRule = componentCss.match(/\.message-row-gemini\.assistant\.is-streaming::after\s*{[\s\S]*?\n}/)?.[0] || ''
assert.match(streamingPelletRule, /transform:\s*none/, 'streaming pellets should not bob or float')
const pelletKeyframes = componentCss.match(/@keyframes camelid-pellets-feed\s*{[\s\S]*?\n}/)?.[0] || ''
assert.doesNotMatch(pelletKeyframes, /translateY|scale[XY]?\(/, 'pellet animation should stay game-steady without bobbing or scaling')
assert.doesNotMatch(componentCss, /camelid-pacman-bob/, 'Pac-Man should stay game-steady instead of bobbing')
assert.doesNotMatch(componentCss, /assistant::after\s*{/, 'completed assistant rows must not keep pellet animation')

console.log('UI regression smoke passed')
