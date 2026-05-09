import { AnchorProvider, Program } from '@coral-xyz/anchor'
import { Connection, PublicKey } from '@solana/web3.js'
import idl from './idl.json'

export const PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_PROGRAM_ID || 'GtY2uhw7s1HEeQY4w4EsPazMftWu3DZEiaZWy9iqV7fY'
)

export function getProgram(connection: Connection, wallet: any) {
  const provider = new AnchorProvider(connection, wallet, {
    commitment: 'confirmed',
  })
  return new Program(idl as any, provider)
}
