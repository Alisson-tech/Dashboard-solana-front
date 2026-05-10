import { AnchorProvider, Program } from '@coral-xyz/anchor'
import { Connection, PublicKey } from '@solana/web3.js'
import idl from './idl.json'

export const PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_PROGRAM_ID || 'J45dp2TMQXx5v5RDygsF3im7URJqu7QQ996V1kqXeNxN'
)

export function getProgram(connection: Connection, wallet: any) {
  const provider = new AnchorProvider(connection, wallet, {
    commitment: 'confirmed',
  })
  // Ensure IDL address matches the runtime env PROGRAM_ID so we always use the
  // program ID configured in .env.local instead of a hardcoded value inside idl.json
  try {
    ;(idl as any).address = PROGRAM_ID.toBase58()
  } catch (e) {
    // If mutation fails, continue — Program constructor will use whatever IDL contains
    console.warn('Failed to override idl.address with env PROGRAM_ID', e)
  }

  // Create Program with provider — IDL.address was overridden above so Program will use the env PROGRAM_ID
  return new Program(idl as any, provider)
}
