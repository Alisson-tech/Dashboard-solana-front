import { Connection, PublicKey } from '@solana/web3.js'

const PROGRAM_ID = process.env.NEXT_PUBLIC_PROGRAM_ID || 'J45dp2TMQXx5v5RDygsF3im7URJqu7QQ996V1kqXeNxN'

export const PROGRAM_PUBKEY = new PublicKey(PROGRAM_ID)

export interface GlobalConfigData {
  admin: PublicKey
  oracle: PublicKey
  treasury: PublicKey
  minStakeAmount: number
  maxChannels: number
  creationFeeBronze: number
  creationFeeSilver: number
  creationFeeGold: number
  creationFeePlatinum: number
  payoutFee: number
  silverThreshold: number
  goldThreshold: number
  platinumThreshold: number
}

export type UserRole = 'creator' | 'editor'

export interface UserProfileData {
  authority: PublicKey
  role: UserRole
  channelIds: string[]
  isBanned: boolean
}

export interface StakeAccountData {
  authority: PublicKey
  amount: number
  depositedAt: number
  withdrawRequestedAt: number
}

export interface VideoPoolData {
  creator: PublicKey
  originalVideoId: string
  prizeVault: PublicKey
  prizeAmount: number
  scoringRules: {
    viewsWeight: number
    likesWeight: number
    commentsWeight: number
  }
  status: number
  participantCount: number
  totalScore: number
  expiryTimestamp: number
}

export interface ParticipantEntryData {
  pool: PublicKey
  user: PublicKey
  channelId: string
  clipLink: string
  views: number
  likes: number
  comments: number
  score: number
  claimed: boolean
}

export const PoolStatus = {
  Open: 0,
  Closed: 1,
  Distributed: 2,
} as const

export type PoolStatusValue = typeof PoolStatus[keyof typeof PoolStatus]

function encodeUTF8(str: string): Uint8Array {
  return new TextEncoder().encode(str)
}

function decodeUTF8(data: Uint8Array): string {
  return new TextDecoder().decode(data).replace(/\0+$/, '')
}

function readBigUInt64LE(data: Uint8Array, offset: number): bigint {
  let result = BigInt(0)
  for (let i = 0; i < 8; i++) {
    result |= BigInt(data[offset + i]) << BigInt(i * 8)
  }
  return result
}

function readUInt16LE(data: Uint8Array, offset: number): number {
  return data[offset] | (data[offset + 1] << 8)
}

function readUInt32LE(data: Uint8Array, offset: number): number {
  return data[offset] | (data[offset + 1] << 8) | (data[offset + 2] << 16) | (data[offset + 3] << 24)
}

function readInt32LE(data: Uint8Array, offset: number): number {
  return data[offset] | (data[offset + 1] << 8) | (data[offset + 2] << 16) | (data[offset + 3] << 24)
}

function sha256sync(message: string): Uint8Array {
  const msgBuffer = encodeUTF8(message)
  const hash = new Uint8Array(32)
  for (let i = 0; i < msgBuffer.length; i++) {
    hash[i % 32] = (hash[i % 32] + msgBuffer[i]) % 256
  }
  return hash
}

export function getGlobalConfigPDA(): PublicKey {
  return PublicKey.findProgramAddressSync([encodeUTF8('global_config_v1')], PROGRAM_PUBKEY)[0]
}

export function getUserProfilePDA(authority: PublicKey | string): PublicKey {
  const auth = typeof authority === 'string' ? new PublicKey(authority) : authority
  return PublicKey.findProgramAddressSync([encodeUTF8('user_profile'), auth.toBytes()], PROGRAM_PUBKEY)[0]
}

export function getStakeAccountPDA(authority: PublicKey | string): PublicKey {
  const auth = typeof authority === 'string' ? new PublicKey(authority) : authority
  return PublicKey.findProgramAddressSync([encodeUTF8('stake'), auth.toBytes()], PROGRAM_PUBKEY)[0]
}

export function getVideoPoolPDA(originalVideoId: string): PublicKey {
  return PublicKey.findProgramAddressSync([encodeUTF8('pool'), encodeUTF8(originalVideoId)], PROGRAM_PUBKEY)[0]
}

export function getPrizeVaultPDA(pool: PublicKey | string): PublicKey {
  const poolKey = typeof pool === 'string' ? new PublicKey(pool) : pool
  return PublicKey.findProgramAddressSync([encodeUTF8('vault'), poolKey.toBytes()], PROGRAM_PUBKEY)[0]
}

export function getCreatorStatsPDA(creator: PublicKey | string): PublicKey {
  const creatorKey = typeof creator === 'string' ? new PublicKey(creator) : creator
  return PublicKey.findProgramAddressSync([encodeUTF8('creator_stats'), creatorKey.toBytes()], PROGRAM_PUBKEY)[0]
}

export function getParticipantEntryPDA(pool: PublicKey | string, clipLink: string): PublicKey {
  const linkHash = sha256sync(clipLink)
  const poolKey = typeof pool === 'string' ? new PublicKey(pool) : pool
  return PublicKey.findProgramAddressSync([encodeUTF8('entry'), poolKey.toBytes(), linkHash], PROGRAM_PUBKEY)[0]
}

export function getLinkHash(clipLink: string): Uint8Array {
  return sha256sync(clipLink)
}

export async function getPools(connection: Connection): Promise<VideoPoolData[]> {
  try {
    console.log('%c=== getPools START ===', 'color: green; font-size: 16px; font-weight: bold;')
    const accounts = await connection.getProgramAccounts(PROGRAM_PUBKEY, {
      encoding: 'base64',
    })

    console.log('%cTotal accounts from RPC:', 'color: blue; font-weight: bold;', accounts.length)
    
    const pools: VideoPoolData[] = []
    const SYSTEM_PROGRAM = new PublicKey('11111111111111111111111111111111')
    
    // VideoPool discriminator from IDL: [133, 206, 71, 13, 121, 10, 79, 129]
    const VIDEO_POOL_DISCRIMINATOR = [133, 206, 71, 13, 121, 10, 79, 129]
    
    let poolsFound = 0
    let skippedInvalidDiscriminator = 0
    let skippedSystemProgram = 0
    let skippedExpired = 0
    let skippedZeroPrize = 0
    
    // Known discriminators from IDL
    const DISCRIMINATORS = {
      VideoPool: [133, 206, 71, 13, 121, 10, 79, 129],
      UserProfile: [32, 37, 119, 205, 179, 180, 13, 194],
      StakeAccount: [80, 158, 67, 124, 50, 189, 192, 255],
      PrizeVault: [34, 226, 195, 160, 248, 75, 50, 7],
    }
    
    const discriminatorCounts: Record<string, number> = {}
    
    for (const acc of accounts) {
      try {
        let rawData: Uint8Array
        const accountData = acc.account.data as any
        
        if (typeof accountData === 'string') {
          rawData = Uint8Array.from(atob(accountData), c => c.charCodeAt(0))
        } else if (accountData && accountData.data) {
          rawData = new Uint8Array(accountData.data)
        } else if (accountData instanceof Uint8Array) {
          rawData = accountData
        } else {
          console.log('%c[DEBUG] Unknown data format:', 'color: red', { type: typeof accountData, keys: Object.keys(accountData || {}) })
          continue
        }
        
        if (rawData.length < 8) continue
        
        const discriminator = Array.from(rawData.slice(0, 8))
        const discHex = discriminator.map(b => b.toString(16).padStart(2, '0')).join(' ')
        
        discriminatorCounts[discHex] = (discriminatorCounts[discHex] || 0) + 1
        
        // Log first few accounts
        if (Object.keys(discriminatorCounts).length <= 3) {
          console.log('%c[DEBUG] Account:', 'color: blue', {
            pubkey: acc.pubkey.toBase58().slice(0, 12),
            dataLen: rawData.length,
            disc: discHex,
            expectedVideoPool: '85 ce 47 0d 79 0a 4f 81'
          })
        }
        
        // Check minimum length (VideoPool size is typically around ~122 bytes depending on string length)
        if (rawData.length < 100) continue
        
        // Check each known discriminator
        let matchedType = null
        for (const [type, expected] of Object.entries(DISCRIMINATORS)) {
          if (expected.every((b, i) => b === discriminator[i])) {
            matchedType = type
            break
          }
        }
        
        if (matchedType === 'VideoPool') {
          console.log('%c[DEBUG] Found VideoPool!', 'color: green', { pubkey: acc.pubkey.toBase58().slice(0, 12), dataLen: rawData.length })
        }
        
        // Verify discriminator (first 8 bytes)
        const isValidDiscriminator = VIDEO_POOL_DISCRIMINATOR.every((b, i) => b === discriminator[i])
        
        if (!isValidDiscriminator) {
          skippedInvalidDiscriminator++
          continue
        }
        
        const data = rawData.slice(8)
        
        // Read video_id: first 4 bytes = length, then the string
        const videoIdLen = readUInt32LE(data, 32)
        const videoIdBytes = data.slice(36, 36 + videoIdLen)
        const originalVideoId = decodeUTF8(videoIdBytes).replace(/\0/g, '').trim()
        
        const currentOffset = 36 + videoIdLen
        
        // Read prizeVault (32 bytes)
        const prizeVault = new PublicKey(data.slice(currentOffset, currentOffset + 32))
        
        if (prizeVault.equals(SYSTEM_PROGRAM)) {
          skippedSystemProgram++
          continue
        }
        
        // Read prizeAmount (8 bytes)
        const prizeAmount = Number(readBigUInt64LE(data, currentOffset + 32))
        if (prizeAmount === 0) {
          skippedZeroPrize++
          continue
        }

        // Read scoring_rules (6 bytes total: 2 bytes each for views, likes, comments)
        const viewsWeight = readUInt16LE(data, currentOffset + 40)
        const likesWeight = readUInt16LE(data, currentOffset + 42)
        const commentsWeight = readUInt16LE(data, currentOffset + 44)

        // Read status (1 byte)
        const status = data[currentOffset + 46]
        if (status === undefined) continue
        const poolStatus = status as PoolStatusValue
        
        // Removed the hardcoded 'PoolStatus.Open' check so Closed pools can be fetched
        
        // Read participantCount (4 bytes)
        const participantCount = readUInt32LE(data, currentOffset + 47)
        
        // Read totalScore (8 bytes)
        const totalScore = Number(readBigUInt64LE(data, currentOffset + 51))
        
        // Read expiryTimestamp as i64 (8 bytes, little-endian signed)
        const expiryRaw = readBigUInt64LE(data, currentOffset + 59)
        // Convert unsigned BigInt to signed (i64 range)
        const expiryTimestamp = expiryRaw > BigInt('9223372036854775807')
          ? Number(expiryRaw - BigInt('18446744073709551616'))
          : Number(expiryRaw)
        const now = Math.floor(Date.now() / 1000)
        const isExpired = expiryTimestamp > 0 && expiryTimestamp <= now
        
        const poolData: VideoPoolData = {
          creator: new PublicKey(data.slice(0, 32)),
          originalVideoId: originalVideoId || 'Unknown',
          prizeVault: prizeVault,
          prizeAmount: prizeAmount,
          scoringRules: {
            viewsWeight: viewsWeight,
            likesWeight: likesWeight,
            commentsWeight: commentsWeight,
          },
          status: poolStatus,
          participantCount: participantCount,
          totalScore: totalScore,
          expiryTimestamp: expiryTimestamp,
        }
        
        pools.push(poolData)
        poolsFound++
      } catch (e) {
        continue
      }
    }
    
    console.log('%c=== getPools END ===', 'color: green; font-size: 16px; font-weight: bold;', {
      poolsFound: pools.length,
      discriminatorCounts,
      skippedInvalidDiscriminator,
      skippedSystemProgram,
      skippedExpired,
      skippedZeroPrize
    })
    
    return pools
  } catch (error) {
    console.error('Error fetching pools:', error)
    return []
  }
}

export async function getPoolEntries(connection: Connection, poolPda: string): Promise<ParticipantEntryData[]> {
  try {
    const poolPDA = new PublicKey(poolPda)
    const accounts = await connection.getProgramAccounts(PROGRAM_PUBKEY, {
      encoding: 'base64',
    })

    const entries: ParticipantEntryData[] = []
    for (const acc of accounts) {
      try {
        const data: Uint8Array = typeof acc.account.data === 'string' 
          ? Uint8Array.from(atob(acc.account.data), c => c.charCodeAt(0))
          : acc.account.data as Uint8Array
        if (data.length < 200) continue
        
        const entryPool = new PublicKey(data.slice(0, 32))
        if (!entryPool.equals(poolPDA)) continue
        
        const entryData: ParticipantEntryData = {
          pool: entryPool,
          user: new PublicKey(data.slice(32, 64)),
          channelId: decodeUTF8(data.slice(64, 128)),
          clipLink: decodeUTF8(data.slice(128, 384)),
          views: Number(readBigUInt64LE(data, 384)),
          likes: Number(readBigUInt64LE(data, 392)),
          comments: Number(readBigUInt64LE(data, 400)),
          score: Number(readBigUInt64LE(data, 408)),
          claimed: data[416] === 1,
        }
        entries.push(entryData)
      } catch {
        continue
      }
    }
    return entries
  } catch (error) {
    console.error('Error fetching entries:', error)
    return []
  }
}

export async function getUserProfile(connection: Connection, authority: PublicKey): Promise<UserProfileData | null> {
  try {
    const userProfilePDA = getUserProfilePDA(authority)
    const accountInfo = await connection.getAccountInfo(userProfilePDA)
    
    if (!accountInfo || accountInfo.data.length === 0) return null
    
    const data: Uint8Array = typeof accountInfo.data === 'string' 
      ? Uint8Array.from(atob(accountInfo.data), c => c.charCodeAt(0))
      : accountInfo.data as Uint8Array
    
    console.log('Profile data length:', data.length, 'First 50 bytes:', Array.from(data.slice(0, 50)))
    
    if (data.length < 50) return null
    
    // First check creator stats to determine role
    let role: UserRole = 'editor'
    let roleSource = 'default'
    
    try {
      const stats = await getCreatorStats(connection, authority)
      console.log('Creator stats for', authority.toBase58(), ':', stats)
      if (stats && stats.poolsCreated > 0) {
        role = 'creator'
        roleSource = 'creator_stats'
      }
    } catch (e) {
      console.log('Error getting creator stats:', e)
    }
    
    // Check data[40] - in the OLD format without role field, data[40] is part of channel_ids
    // The vec length is at data[8], so data[40] would be the 32nd byte of channel data
    // Only trust if data[40] is 0 or 1 AND data[8] shows a reasonable vec length
    const vecLen = readUInt32LE(data, 8)
    console.log('Channel IDs vec length at data[8]:', vecLen)
    
    if (data[40] !== undefined && (data[40] === 0 || data[40] === 1) && vecLen <= 10) {
      console.log('Found role byte:', data[40], 'at data[40]')
      role = data[40] === 0 ? 'creator' : 'editor'
      roleSource = 'data_byte'
    } else {
      console.log('NOT using data[40] as role byte - vecLen:', vecLen, 'data[40]:', data[40])
    }
    
    console.log('Final role for', authority.toBase58(), ':', role, 'source:', roleSource)
    
    // Parse channel_ids - position depends on format
    // Old format: vec length at data[8]
    // New format: role at data[40], vec length at data[41]
    const hasRoleField = data[40] !== undefined && data[40] <= 1
    const channelIdsVecLen = hasRoleField ? readUInt32LE(data, 41) : readUInt32LE(data, 8)
    const channelIdsOffset = hasRoleField ? 45 : 12
    
    let channelIds: string[] = []
    let offset = channelIdsOffset
    
    for (let i = 0; i < channelIdsVecLen && offset < data.length; i++) {
      const channelIdLen = readUInt16LE(data, offset)
      offset += 2
      if (channelIdLen > 0 && offset + channelIdLen <= data.length) {
        const channelId = decodeUTF8(data.slice(offset, offset + channelIdLen))
        if (channelId) channelIds.push(channelId)
        offset += channelIdLen
      }
    }
    
    // Find isBanned byte position
    const isBannedOffset = hasRoleField 
      ? offset + (channelIdsVecLen * 2) + 4 
      : offset + (channelIdsVecLen * 2)
    const isBanned = (isBannedOffset < data.length && data[isBannedOffset] === 1)
    
    console.log('User profile parsed:', { role, channelIds: channelIds.length, isBanned, hasRoleField, dataLength: data.length })
    
    return {
      authority,
      role,
      channelIds,
      isBanned,
    }
  } catch (e) {
    console.error('Error fetching user profile:', e)
    return null
  }
}

export async function getStakeAccount(connection: Connection, authority: PublicKey): Promise<StakeAccountData | null> {
  try {
    const stakeAccountPDA = getStakeAccountPDA(authority)
    const accountInfo = await connection.getAccountInfo(stakeAccountPDA)
    
    if (!accountInfo || accountInfo.data.length === 0) return null
    
    const data: Uint8Array = typeof accountInfo.data === 'string' 
      ? Uint8Array.from(atob(accountInfo.data), c => c.charCodeAt(0))
      : accountInfo.data as Uint8Array
    return {
      authority,
      amount: Number(readBigUInt64LE(data, 0)),
      depositedAt: readInt32LE(data, 8),
      withdrawRequestedAt: readInt32LE(data, 16),
    }
  } catch {
    return null
  }
}

export async function getCreatorStats(connection: Connection, creator: PublicKey): Promise<{ poolsCreated: number } | null> {
  try {
    const statsPDA = getCreatorStatsPDA(creator)
    const accountInfo = await connection.getAccountInfo(statsPDA)
    
    if (!accountInfo || accountInfo.data.length === 0) return null
    
    const data: Uint8Array = typeof accountInfo.data === 'string' 
      ? Uint8Array.from(atob(accountInfo.data), c => c.charCodeAt(0))
      : accountInfo.data as Uint8Array
    return {
      poolsCreated: readUInt32LE(data, 0),
    }
  } catch {
    return null
  }
}