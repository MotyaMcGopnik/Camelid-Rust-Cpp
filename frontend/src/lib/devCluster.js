/* Client for the dev-server cluster helpers (see vite.config.js):
   real localhost-only actions, no cloud. Fails soft when the dev hook isn't
   present (static build) so the UI can fall back to config-only behavior. */
const BASE = '/__camelid/cluster'

async function parseJson(response) {
  const text = await response.text()
  return JSON.parse(text) // throws on HTML fallback
}

/** TCP reachability + latency probe for host:port. */
export async function probeNode({ host, port }) {
  try {
    const response = await fetch(`${BASE}/probe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ host, port }),
    })
    const data = await parseJson(response)
    return { available: true, ...data }
  } catch {
    return { available: false }
  }
}

/** Safe local discovery: mDNS (dns-sd/avahi) or ARP table; review before adding. */
export async function discoverDevices() {
  try {
    const response = await fetch(`${BASE}/discover`, { headers: { Accept: 'application/json' } })
    const data = await parseJson(response)
    return data && data.available ? data : { available: false, devices: [] }
  } catch {
    return { available: false, devices: [] }
  }
}
