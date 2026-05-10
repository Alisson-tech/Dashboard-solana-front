const { Connection, PublicKey } = require('@solana/web3.js');

async function checkStatus() {
  const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
  const wallet = new PublicKey('AStfJETXKGY9aHXr9PVMSWck6htEW6zQyA9BftpC3qaB');
  const PROGRAM_ID = new PublicKey('J45dp2TMQXx5v5RDygsF3im7URJqu7QQ996V1kqXeNxN');
  
  // Profile PDA
  const [profilePDA] = PublicKey.findProgramAddressSync(
    [Buffer.from('user_profile'), wallet.toBuffer()],
    PROGRAM_ID
  );
  
  // Stake Account PDA
  const [stakeAccountPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from('stake_account'), wallet.toBuffer()],
    PROGRAM_ID
  );
  
  console.log('=== ONBOARDING STATUS CHECK ===\n');
  
  // Check profile
  const profileInfo = await connection.getAccountInfo(profilePDA);
  console.log('✓ Profile exists:', !!profileInfo);
  
  if (profileInfo) {
    const data = profileInfo.data;
    
    // Authority
    const authority = new PublicKey(data.slice(8, 40));
    console.log('✓ Authority:', authority.toBase58() === wallet.toBase58() ? '✅ Matches' : '❌ Mismatch');
    
    // Role
    const role = data[40] === 1 ? 'editor' : 'creator';
    console.log('✓ Role:', role);
    
    // Channels
    console.log('\n=== CHANNELS ===');
    let offset = 44;
    let channelCount = 0;
    const channels = [];
    
    while (offset < data.length - 3) {
      const len = data.slice(offset, offset + 4).readUInt32LE(0);
      if (len === 0 || len > 1000 || offset + 4 + len > data.length) break;
      
      const channelId = data.slice(offset + 4, offset + 4 + len).toString('utf8');
      channels.push(channelId);
      channelCount++;
      offset += 4 + len;
    }
    
    console.log(`Found ${channelCount} channel(s):`);
    channels.forEach((ch, i) => console.log(`  ${i+1}. ${ch}`));
  }
  
  // Check stake
  const stakeInfo = await connection.getAccountInfo(stakeAccountPDA);
  console.log('\n✓ Stake account exists:', !!stakeInfo);
  
  if (stakeInfo) {
    const data = stakeInfo.data;
    if (data.length >= 16) {
      const amountBigInt = data.slice(8, 16).readBigUInt64LE(0);
      const amountSOL = Number(amountBigInt) / 1e9;
      console.log(`✓ Stake amount: ${amountSOL.toFixed(4)} SOL`);
    }
  }
  
  console.log('\n=== SUMMARY ===');
  console.log('Profile:', profileInfo ? '✅' : '❌');
  console.log('Channels:', channels.length > 0 ? `✅ (${channels.length})` : '❌');
  console.log('Stake:', stakeInfo ? '✅' : '❌');
  console.log('\nShould unlock:', profileInfo && channels.length > 0 && stakeInfo ? '✅ YES' : '❌ NO');
}

checkStatus();
