const { Connection, PublicKey } = require('@solana/web3.js');

async function checkStake() {
  const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
  const wallet = new PublicKey('AStfJETXKGY9aHXr9PVMSWck6htEW6zQyA9BftpC3qaB');
  const PROGRAM_ID = new PublicKey('J45dp2TMQXx5v5RDygsF3im7URJqu7QQ996V1kqXeNxN');
  
  // Derive the PDA for stake account
  const [stakeAccountPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from('stake_account'), wallet.toBuffer()],
    PROGRAM_ID
  );
  
  console.log('Checking stake for:', wallet.toBase58());
  console.log('Stake Account PDA:', stakeAccountPDA.toBase58());
  
  try {
    const accountInfo = await connection.getAccountInfo(stakeAccountPDA);
    
    if (!accountInfo) {
      console.log('\n❌ NO STAKE ACCOUNT FOUND');
      return;
    }
    
    console.log('\n✅ STAKE ACCOUNT EXISTS!');
    console.log('Account size:', accountInfo.data.length, 'bytes');
    
    const data = accountInfo.data;
    
    // Parse stake data
    // Typically: [8 bytes discriminator][8 bytes amount][8 bytes deposited_at]
    console.log('\nRaw data (first 100 bytes):', data.slice(0, 100).toString('hex'));
    
    // Try to parse amount as u64 at offset 8
    if (data.length >= 16) {
      const amountBN = data.slice(8, 16);
      const amountBigInt = amountBN.readBigUInt64LE(0);
      const amountSOL = Number(amountBigInt) / 1e9;
      
      console.log('\nAmount:', amountBigInt.toString(), 'lamports');
      console.log('Amount (SOL):', amountSOL.toFixed(4), 'SOL');
    }
    
    // Try to find deposited_at timestamp
    if (data.length >= 24) {
      const timestampBN = data.slice(16, 24);
      const timestamp = timestampBN.readBigUInt64LE(0);
      console.log('Deposited at:', new Date(Number(timestamp) * 1000).toISOString());
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkStake();
