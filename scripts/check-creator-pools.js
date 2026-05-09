const { Connection, PublicKey } = require('@solana/web3.js')

const PROGRAM_ID = process.env.NEXT_PUBLIC_PROGRAM_ID || 'J45dp2TMQXx5v5RDygsF3im7URJqu7QQ996V1kqXeNxN'
const CREATOR_ADDRESS = process.argv[2] || '5grFnXBws4tL4L88tjZL5qYuBBrhiRTmdaRFy7nbG959'
const CLUSTER = process.argv[3] || 'devnet'

const PoolStatus = {
  Open: 0,
  Closed: 1,
  Distributed: 2,
}

const VIDEO_POOL_DISCRIMINATOR = [133, 206, 71, 13, 121, 10, 79, 129]
const SYSTEM_PROGRAM = new PublicKey('11111111111111111111111111111111')
const EXPECTED_DISCRIM = VIDEO_POOL_DISCRIMINATOR.join(' ')

function readUInt32LE(data, offset) {
  if (!data || offset + 3 >= data.length) return 0
  return data[offset] | (data[offset + 1] << 8) | (data[offset + 2] << 16) | (data[offset + 3] << 24)
}

function readInt32LE(data, offset) {
  if (!data || offset + 3 >= data.length) return 0
  return data[offset] | (data[offset + 1] << 8) | (data[offset + 2] << 16) | (data[offset + 3] << 24)
}

function readBigUInt64LE(data, offset) {
  if (!data || offset + 7 >= data.length) return BigInt(0)
  let result = BigInt(0)
  for (let i = 0; i < 8; i++) {
    result |= BigInt(data[offset + i]) << BigInt(i * 8)
  }
  return result
}

function readUInt16LE(data, offset) {
  if (!data || offset + 1 >= data.length) return 0
  return data[offset] | (data[offset + 1] << 8)
}

function decodeUTF8(data) {
  return new TextDecoder().decode(data).replace(/\0+$/, '')
}

function parseData(accountData) {
  if (!accountData) return null
  // Handle Buffer/Uint8Array correctly
  if (Buffer && Buffer.isBuffer(accountData)) {
    return new Uint8Array(accountData)
  }
  if (accountData instanceof Uint8Array) {
    return accountData
  }
  return null
}

async function getCreatorPools(connection, creator, options = {}) {
  console.log('Fetching program accounts...')
  const accounts = await connection.getProgramAccounts(new PublicKey(PROGRAM_ID), {
    encoding: 'base64',
  })

  console.log(`Found ${accounts.length} program accounts`)

  const creatorPubkey = typeof creator === 'string' ? new PublicKey(creator) : creator
  const pools = []
  let skippedInvalidDiscriminator = 0
  let skippedWrongCreator = 0
  let skippedFilter = 0

  for (const acc of accounts) {
    const rawData = parseData(acc.account.data)

    if (!rawData || rawData.length < 180) continue

    // Check discriminator exactly
    const first8 = Array.from(rawData.slice(0, 8)).join(' ')
    if (first8 !== EXPECTED_DISCRIM) {
      skippedInvalidDiscriminator++
      continue
    }

    const data = rawData.slice(8)

    // Get creator from data
    const poolCreator = new PublicKey(data.slice(0, 32))
    if (!poolCreator.equals(creatorPubkey)) {
      skippedWrongCreator++
      continue
    }

    const status = data[146]
    if (!options?.includeClosed && status !== PoolStatus.Open) {
      skippedFilter++
      continue
    }

    const prizeVault = new PublicKey(data.slice(100, 132))
    const videoIdLen = readUInt32LE(data, 32)
    const videoIdBytes = data.slice(36, 36 + Math.min(videoIdLen, 64))
    const originalVideoId = decodeUTF8(videoIdBytes).replace(/\0/g, '').trim()
    const prizeAmount = Number(readBigUInt64LE(data, 132))
    const expiryTimestamp = readInt32LE(data, 159)

    pools.push({
      pda_address: acc.pubkey,
      creator: poolCreator,
      originalVideoId: originalVideoId || 'Unknown',
      prizeVault: prizeVault,
      prizeAmount: prizeAmount,
      scoringRules: {
        viewsWeight: readUInt16LE(data, 140),
        likesWeight: readUInt16LE(data, 142),
        commentsWeight: readUInt16LE(data, 144),
      },
      status: status,
      participantCount: readUInt32LE(data, 147),
      totalScore: Number(readBigUInt64LE(data, 151)),
      expiryTimestamp: expiryTimestamp,
    })
  }

  console.log(`\nSkip breakdown:`)
  console.log(`  - Invalid discriminator: ${skippedInvalidDiscriminator}`)
  console.log(`  - Wrong creator: ${skippedWrongCreator}`)
  console.log(`  - Status filter: ${skippedFilter}`)

  return pools
}

async function main() {
  const RPC_URL = CLUSTER === 'mainnet'
    ? process.env.NEXT_PUBLIC_RPC_URL || 'https://api.mainnet-beta.solana.com'
    : process.env.NEXT_PUBLIC_RPC_URL || 'https://api.devnet.solana.com'

  console.log(`\n=== Creator Pools Scanner ===`)
  console.log(`Creator: ${CREATOR_ADDRESS}`)
  console.log(`Cluster: ${CLUSTER}`)
  console.log(`RPC: ${RPC_URL}\n`)

  const connection = new Connection(RPC_URL, 'confirmed')
  const creator = new PublicKey(CREATOR_ADDRESS)

  const pools = await getCreatorPools(connection, creator, { includeClosed: true })

  console.log(`\nTotal pools found: ${pools.length}\n`)

  const openPools = pools.filter(p => p.status === PoolStatus.Open)
  const closedPools = pools.filter(p => p.status === PoolStatus.Closed)
  const distributedPools = pools.filter(p => p.status === PoolStatus.Distributed)

  console.log(`Status breakdown:`)
  console.log(`  - Open: ${openPools.length}`)
  console.log(`  - Closed: ${closedPools.length}`)
  console.log(`  - Distributed: ${distributedPools.length}`)

  const totalPrize = pools.reduce((acc, p) => acc + Number(p.prizeAmount), 0) / 1e9
  console.log(`\nTotal prize locked: ${totalPrize.toFixed(2)} SOL`)

  const totalParticipants = pools.reduce((acc, p) => acc + p.participantCount, 0)
  console.log(`Total participants: ${totalParticipants}`)

  if (pools.length > 0) {
    console.log(`\n=== Pool Details ===\n`)
    pools.forEach((pool, i) => {
      const statusName = pool.status === PoolStatus.Open ? 'OPEN' 
        : pool.status === PoolStatus.Closed ? 'CLOSED' 
        : 'DISTRIBUTED'
      const prizeSol = Number(pool.prizeAmount) / 1e9
      console.log(`${i + 1}. ${pool.originalVideoId}`)
      console.log(`   Status: ${statusName} | Prize: ${prizeSol.toFixed(2)} SOL | Participants: ${pool.participantCount}`)
      console.log(`   PDA: ${pool.pda_address.toBase58()}`)
    })
  }
}

main().catch(console.error)