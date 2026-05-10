import { Connection, PublicKey } from '@solana/web3.js'
import { getCreatorPools, VideoPoolData, PoolStatus } from './lib/solana'

const CREATOR_ADDRESS = process.argv[2] || '5grFnXBws4tL4L88tjZL5qYuBBrhiRTmdaRFy7nbG959'
const CLUSTER = process.argv[3] || 'devnet'

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

  console.log(`Total pools found: ${pools.length}\n`)

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