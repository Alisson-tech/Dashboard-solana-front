#!/usr/bin/env node
const { Connection, PublicKey } = require('@solana/web3.js')

async function main() {
  const RPC = process.env.RPC_URL || 'https://api.devnet.solana.com'
  const conn = new Connection(RPC, 'confirmed')

  // Use program id from env if available to avoid hardcoding
  const programIdStr = process.env.NEXT_PUBLIC_PROGRAM_ID || 'J45dp2TMQXx5v5RDygsF3im7URJqu7QQ996V1kqXeNxN'
  const programA = new PublicKey(programIdStr)

  const [pdaA] = PublicKey.findProgramAddressSync([Buffer.from('global_config_v1')], programA)
  const infoA = await conn.getAccountInfo(pdaA)

  console.log('Program:', programA.toBase58())
  console.log('Config PDA:', pdaA.toBase58())
  if (!infoA) console.log('  -> Not found')
  else console.log('  -> owner:', infoA.owner.toBase58(), 'lamports:', infoA.lamports, 'dataLen:', infoA.data?.length)
}

main().catch(e => { console.error(e); process.exit(1) })
