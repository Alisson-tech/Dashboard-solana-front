/**
 * Reads all pools from the Solana blockchain and saves the YouTube video
 * title for each pool that doesn't have one stored in the core-api database.
 *
 * Usage:
 *   node scripts/enrich-pool-titles.js [cluster]
 *
 * Examples:
 *   node scripts/enrich-pool-titles.js           # devnet (default)
 *   node scripts/enrich-pool-titles.js mainnet
 */

const { Connection, PublicKey } = require('@solana/web3.js')

const PROGRAM_ID = process.env.NEXT_PUBLIC_PROGRAM_ID || 'J45dp2TMQXx5v5RDygsF3im7URJqu7QQ996V1kqXeNxN'
const CORE_API_URL = process.env.NEXT_PUBLIC_CORE_API_URL || 'http://localhost:8001/api/v1'
const CLUSTER = process.argv[2] || 'devnet'

const VIDEO_POOL_DISCRIMINATOR = [133, 206, 71, 13, 121, 10, 79, 129]
const EXPECTED_DISCRIM = VIDEO_POOL_DISCRIMINATOR.join(' ')

// ── Binary decode helpers ─────────────────────────────────────────────────────

function readUInt32LE(data, offset) {
  if (!data || offset + 3 >= data.length) return 0
  return data[offset] | (data[offset + 1] << 8) | (data[offset + 2] << 16) | (data[offset + 3] << 24)
}

function readBigUInt64LE(data, offset) {
  if (!data || offset + 7 >= data.length) return BigInt(0)
  let result = BigInt(0)
  for (let i = 0; i < 8; i++) result |= BigInt(data[offset + i]) << BigInt(i * 8)
  return result
}

function readUInt16LE(data, offset) {
  if (!data || offset + 1 >= data.length) return 0
  return data[offset] | (data[offset + 1] << 8)
}

function decodeUTF8(data) {
  return new TextDecoder().decode(data).replace(/\0+$/, '')
}

// ── On-chain pool reader ──────────────────────────────────────────────────────

async function getAllPools(connection) {
  console.log('Fetching all program accounts from blockchain...')
  const accounts = await connection.getProgramAccounts(new PublicKey(PROGRAM_ID), {
    encoding: 'base64',
  })
  console.log(`Found ${accounts.length} program accounts`)

  const pools = []
  for (const acc of accounts) {
    const buffer = acc.account.data
    // VideoPool accounts are ~177 bytes; minimum needed is 8 (discrim) + 44 (video_id start) = 52
    const rawData = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer[0], 'base64')
    if (!rawData || rawData.length < 52) continue

    const first8 = Array.from(rawData.slice(0, 8)).join(' ')
    if (first8 !== EXPECTED_DISCRIM) continue

    const data = rawData.slice(8)
    const videoIdLen = readUInt32LE(data, 32)
    const videoIdBytes = data.slice(36, 36 + Math.min(videoIdLen, 64))
    const originalVideoId = decodeUTF8(videoIdBytes).replace(/\0/g, '').trim()

    if (!originalVideoId) continue

    pools.push({
      pda: acc.pubkey.toBase58(),
      video_id: originalVideoId,
      status: data[146],
      prize_amount: Number(readBigUInt64LE(data, 132)) / 1e9,
    })
  }

  return pools
}

// ── Core API caller ───────────────────────────────────────────────────────────

async function enrichTitles(items) {
  const resp = await fetch(`${CORE_API_URL}/pools/batch-enrich-titles`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(items),
  })

  if (!resp.ok) {
    const text = await resp.text()
    throw new Error(`API error ${resp.status}: ${text}`)
  }

  return resp.json()
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const RPC_URL =
    CLUSTER === 'mainnet'
      ? process.env.NEXT_PUBLIC_RPC_URL || 'https://api.mainnet-beta.solana.com'
      : process.env.NEXT_PUBLIC_RPC_URL || 'https://api.devnet.solana.com'

  console.log(`\n=== SolCuts — Pool Title Enricher ===`)
  console.log(`Cluster : ${CLUSTER}`)
  console.log(`RPC     : ${RPC_URL}`)
  console.log(`API     : ${CORE_API_URL}\n`)

  const connection = new Connection(RPC_URL, 'confirmed')

  const pools = await getAllPools(connection)
  console.log(`\nTotal pools parsed: ${pools.length}`)

  if (pools.length === 0) {
    console.log('Nothing to enrich.')
    return
  }

  const statusNames = ['OPEN', 'CLOSED', 'DISTRIBUTED']
  pools.forEach(p => {
    const s = statusNames[p.status] || 'UNKNOWN'
    console.log(`  [${s}] ${p.video_id.padEnd(14)} → ${p.pda}`)
  })

  console.log(`\nCalling batch-enrich-titles...`)
  const result = await enrichTitles(pools.map(p => ({ pda: p.pda, video_id: p.video_id })))

  console.log(`\nResult:`)
  console.log(`  Updated : ${result.updated}  (YouTube title saved to DB)`)
  console.log(`  Skipped : ${result.skipped}  (already had a title)`)
  console.log(`\nDone.`)
}

main().catch(err => {
  console.error('Error:', err.message)
  process.exit(1)
})
