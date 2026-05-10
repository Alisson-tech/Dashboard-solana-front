import { Connection, PublicKey } from '@solana/web3.js'
import { getProgram } from './anchor/program'

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
  pda_address: PublicKey
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
  if (!data || offset === undefined || offset + 7 >= data.length) {
    return BigInt(0)
  }
  let result = BigInt(0)
  for (let i = 0; i < 8; i++) {
    result |= BigInt(data[offset + i]) << BigInt(i * 8)
  }
  return result
}

function readUInt16LE(data: Uint8Array, offset: number): number {
  if (!data || offset + 1 >= data.length) return 0
  return data[offset] | (data[offset + 1] << 8)
}

function readUInt32LE(data: Uint8Array, offset: number): number {
  if (!data || offset + 3 >= data.length) return 0
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


function mapStatusObj(statusObj: any): number {
  if (statusObj && typeof statusObj === 'object') {
    if ('open' in statusObj || statusObj.Open || statusObj.open !== undefined) return 0;
    if ('closed' in statusObj || statusObj.Closed || statusObj.closed !== undefined) return 1;
    if ('distributed' in statusObj || statusObj.Distributed || statusObj.distributed !== undefined) return 2;
  }
  return typeof statusObj === 'number' ? statusObj : 0;
}

export async function getPools(connection: Connection, options?: { includeClosed?: boolean }): Promise<VideoPoolData[]> {
  try {
    const dummyWallet = { publicKey: PROGRAM_PUBKEY } as any;
    const program = getProgram(connection, dummyWallet);
    const poolsRaw = await program.account.videoPool.all();

    const pools = poolsRaw.map(p => {
       const raw = p.account;
       return {
         pda_address: p.publicKey,
         creator: raw.creator,
         originalVideoId: raw.originalVideoId || '',
         prizeVault: raw.prizeVault,
         prizeAmount: Number(raw.prizeAmount),
         scoringRules: {
           viewsWeight: raw.scoringRules.viewsWeight,
           likesWeight: raw.scoringRules.likesWeight,
           commentsWeight: raw.scoringRules.commentsWeight,
         },
         status: mapStatusObj(raw.status) as typeof PoolStatus[keyof typeof PoolStatus],
         participantCount: raw.participantCount,
         totalScore: Number(raw.totalScore),
         expiryTimestamp: Number(raw.expiryTimestamp)
       };
    });
    
    return options?.includeClosed ? pools : pools.filter(p => p.status === 0);
  } catch (error) {
    console.error('Error fetching pools:', error);
    return [];
  }
}

export async function getCreatorPools(connection: Connection, creator: PublicKey, options?: { includeClosed?: boolean }): Promise<VideoPoolData[]> {
  try {
    const allPools = await getPools(connection, options);
    return allPools.filter(p => p.creator.equals(creator));
  } catch (error) {
    console.error('Error fetching creator pools:', error);
    return [];
  }
}

export async function getPoolEntries(connection: Connection, poolPda: string): Promise<ParticipantEntryData[]> {
  try {
    const dummyWallet = { publicKey: PROGRAM_PUBKEY } as any;
    const program = getProgram(connection, dummyWallet);
    const poolPubkey = new PublicKey(poolPda);
    
    // Memory compare won't work well due to bs58 encoding length issues with JS wrappers sometimes, 
    // but .all() then .filter() works very well for <1000 items. Let's use filter!
    const entriesRaw = await program.account.participantEntry.all();
    
    return entriesRaw.filter(e => e.account.pool.equals(poolPubkey)).map(e => {
      const raw = e.account;
      return {
        pool: raw.pool,
        user: raw.user,
        channelId: raw.channelId || '',
        clipLink: raw.clipLink || '',
        views: Number(raw.views),
        likes: Number(raw.likes),
        comments: Number(raw.comments),
        score: Number(raw.score),
        claimed: raw.claimed,
        pda_address: e.publicKey
      };
    });
  } catch (error) {
    console.error('Error fetching entries:', error);
    return [];
  }
}

export async function getCreatorEntries(connection: Connection, creator: PublicKey): Promise<ParticipantEntryData[]> {
  try {
    const dummyWallet = { publicKey: PROGRAM_PUBKEY } as any;
    const program = getProgram(connection, dummyWallet);
    
    const entriesRaw = await program.account.participantEntry.all();
    
    return entriesRaw.filter(e => e.account.user.equals(creator)).map(e => {
      const raw = e.account;
      return {
        pool: raw.pool,
        user: raw.user,
        channelId: raw.channelId || '',
        clipLink: raw.clipLink || '',
        views: Number(raw.views),
        likes: Number(raw.likes),
        comments: Number(raw.comments),
        score: Number(raw.score),
        claimed: raw.claimed,
        pda_address: e.publicKey
      };
    });
  } catch (error) {
    console.error('Error fetching creator entries:', error);
    return [];
  }
}

export async function getUserProfile(connection: Connection, authority: PublicKey): Promise<UserProfileData | null> {
  try {
    console.log('[getUserProfile] looking up for:', authority.toBase58(), 'PROGRAM:', PROGRAM_PUBKEY.toBase58())
    const userProfilePDA = getUserProfilePDA(authority)
    console.log('[getUserProfile] expected PDA:', userProfilePDA.toBase58())
    const accountInfo = await connection.getAccountInfo(userProfilePDA)

    if (!accountInfo || accountInfo.data.length === 0) return null

    // Handle Buffer or Uint8Array correctly
    const accountData = accountInfo.data as Uint8Array
    const data: Uint8Array = Buffer && Buffer.isBuffer(accountData)
      ? new Uint8Array(accountData)
      : accountData instanceof Uint8Array
        ? accountData
        : new Uint8Array(accountData.data)
    
    console.log('Profile data length:', data.length, 'First 50 bytes:', Array.from(data.slice(0, 50)))
    
    if (data.length < 50) return null
    
    // First check creator stats to determine role
    let role: UserRole = 'editor'
    let roleSource = 'default'
    
    try {
      console.log('[getUserProfile] checking CreatorStats for role...')
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

    const accountData = accountInfo.data as Uint8Array
    const data: Uint8Array = Buffer && Buffer.isBuffer(accountData)
      ? new Uint8Array(accountData)
      : accountData instanceof Uint8Array
        ? accountData
        : new Uint8Array(accountData.data)
    
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
    console.log('[getCreatorStats] creator:', creator.toBase58(), 'statsPDA:', statsPDA.toBase58())
    const accountInfo = await connection.getAccountInfo(statsPDA)

    if (!accountInfo || accountInfo.data.length === 0) return null
    
    const accountData = accountInfo.data as Uint8Array
    const data: Uint8Array = Buffer && Buffer.isBuffer(accountData)
      ? new Uint8Array(accountData)
      : accountData instanceof Uint8Array
        ? accountData
        : new Uint8Array(accountData.data)
    
    return {
      poolsCreated: readUInt32LE(data, 0),
    }
  } catch {
    return null
  }
}

export async function getGlobalConfig(connection: Connection): Promise<GlobalConfigData | null> {
  try {
    const configPDA = getGlobalConfigPDA()
    const accountInfo = await connection.getAccountInfo(configPDA)

    if (!accountInfo || accountInfo.data.length === 0) return null

    // Handle Buffer or Uint8Array correctly
    const data: Uint8Array = Buffer && Buffer.isBuffer(accountInfo.data)
      ? new Uint8Array(accountInfo.data)
      : accountInfo.data instanceof Uint8Array
        ? accountInfo.data
        : accountInfo.data.data
          ? new Uint8Array(accountInfo.data.data)
          : Uint8Array.from(atob(accountInfo.data as string), c => c.charCodeAt(0))

    // Validate minimum data length (at least: admin + oracle + treasury + min_stake + max_channels + bump = 106)
    if (data.length < 106) {
      console.warn('GlobalConfig data too short:', data.length)
      return null
    }

    const globalConfig: GlobalConfigData = {
      admin: new PublicKey(data.slice(0, 32)),
      oracle: new PublicKey(data.slice(32, 64)),
      treasury: new PublicKey(data.slice(64, 96)),
      minStakeAmount: Number(readBigUInt64LE(data, 96)),
      maxChannels: data[104] ?? 0,
      creationFeeBronze: data[105] ?? 0,
      creationFeeSilver: data[106] ?? 0,
      creationFeeGold: data[107] ?? 0,
      creationFeePlatinum: data[108] ?? 0,
      payoutFee: data[109] ?? 0,
      silverThreshold: data[110] ?? 0,
      goldThreshold: data[111] ?? 0,
      platinumThreshold: data[112] ?? 0,
    }

    return globalConfig
  } catch (error) {
    console.error('Error fetching global config:', error)
    return null
  }
}