#!/usr/bin/env node
const { Connection, PublicKey } = require('@solana/web3.js')

// Config
const RPC = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com'
const PROGRAM_ID = process.env.NEXT_PUBLIC_PROGRAM_ID || 'J45dp2TMQXx5v5RDygsF3im7URJqu7QQ996V1kqXeNxN'

function encodeUTF8(str) { return Buffer.from(str, 'utf8') }

async function findPDA(seed, pubkey) {
  const program = new PublicKey(PROGRAM_ID)
  const auth = new PublicKey(pubkey)
  const [pda] = await PublicKey.findProgramAddress([encodeUTF8(seed), auth.toBytes()], program)
  return pda
}

function readUInt32LE(buf, offset) {
  if (!buf || offset + 3 >= buf.length) return 0
  return buf[offset] | (buf[offset+1]<<8) | (buf[offset+2]<<16) | (buf[offset+3]<<24)
}

function readUInt16LE(buf, offset) {
  if (!buf || offset + 1 >= buf.length) return 0
  return buf[offset] | (buf[offset+1]<<8)
}

function readBigUInt64LE(buf, offset) {
  if (!buf || offset + 7 >= buf.length) return BigInt(0)
  let res = BigInt(0)
  for (let i=0;i<8;i++) res |= BigInt(buf[offset+i]) << BigInt(i*8)
  return res
}

function decodeUTF8(buf) { return Buffer.from(buf).toString('utf8').replace(/\0+$/,'') }

async function getUserProfile(connection, authority) {
  const pda = await findPDA('user_profile', authority)
  const info = await connection.getAccountInfo(pda)
  if (!info) return { exists: false }
  const data = info.data
  // Try to parse similarly to frontend logic
  const buf = Buffer.from(data)
  if (buf.length < 12) return { exists: true, rawLength: buf.length }
  const vecLenOld = readUInt32LE(buf, 8)
  const hasRoleField = buf[40] !== undefined && buf[40] <= 1
  const channelIdsVecLen = hasRoleField ? readUInt32LE(buf, 41) : readUInt32LE(buf, 8)
  const channelIdsOffset = hasRoleField ? 45 : 12
  let offset = channelIdsOffset
  const channelIds = []
  for (let i=0;i<channelIdsVecLen && offset < buf.length;i++){
    const l = readUInt16LE(buf, offset)
    offset += 2
    if (l>0 && offset + l <= buf.length) {
      const ch = decodeUTF8(buf.slice(offset, offset+l))
      channelIds.push(ch)
      offset += l
    }
  }
  return { exists: true, pda: pda.toBase58(), channelIds, rawLength: buf.length }
}

async function getStake(connection, authority) {
  const program = new PublicKey(PROGRAM_ID)
  const auth = new PublicKey(authority)
  const [pda] = await PublicKey.findProgramAddress([encodeUTF8('stake'), auth.toBytes()], program)
  const info = await connection.getAccountInfo(pda)
  if (!info) return { exists: false }
  const buf = Buffer.from(info.data)
  const amount = Number(readBigUInt64LE(buf, 0))
  return { exists: true, pda: pda.toBase58(), amount }
}

async function main() {
  const arg = process.argv[2]
  if (!arg) { console.error('Usage: node check_user.js <PUBKEY>'); process.exit(1) }
  const connection = new Connection(RPC, 'confirmed')
  console.log('RPC:', RPC)
  console.log('Program:', PROGRAM_ID)
  try {
    const profile = await getUserProfile(connection, arg)
    console.log('UserProfile:', profile)
  } catch (e) {
    console.error('Error fetching profile:', e)
  }
  try {
    const stake = await getStake(connection, arg)
    console.log('StakeAccount:', stake)
  } catch (e) {
    console.error('Error fetching stake:', e)
  }
}

main()
