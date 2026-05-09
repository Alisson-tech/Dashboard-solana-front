const { Connection, PublicKey } = require('@solana/web3.js');

async function checkProfile() {
  const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
  const wallet = new PublicKey('AStfJETXKGY9aHXr9PVMSWck6htEW6zQyA9BftpC3qaB');
  const PROGRAM_ID = new PublicKey('J45dp2TMQXx5v5RDygsF3im7URJqu7QQ996V1kqXeNxN');
  
  // Derive the PDA for this wallet
  const [profilePDA] = PublicKey.findProgramAddressSync(
    [Buffer.from('user_profile'), wallet.toBuffer()],
    PROGRAM_ID
  );
  
  console.log('Checking profile for:', wallet.toBase58());
  console.log('Profile PDA:', profilePDA.toBase58());
  
  try {
    const accountInfo = await connection.getAccountInfo(profilePDA);
    
    if (!accountInfo) {
      console.log('\n❌ NO PROFILE FOUND - Account does not exist');
      return;
    }
    
    console.log('\n✅ PROFILE EXISTS!');
    console.log('Account owner:', accountInfo.owner.toBase58());
    console.log('Account size:', accountInfo.data.length, 'bytes');
    
    // Parse the data
    const data = accountInfo.data;
    
    // Authority (32 bytes)
    const authority = new PublicKey(data.slice(8, 40));
    console.log('Authority:', authority.toBase58());
    
    // Role (1 byte) at offset 40
    const roleByte = data[40];
    const role = roleByte === 0 ? 'creator' : roleByte === 1 ? 'editor' : 'unknown';
    console.log('Role:', role);
    
    // Channel IDs count (4 bytes, little-endian) at offset 41
    const channelCountBytes = data.slice(41, 45);
    const channelCount = channelCountBytes.readUInt32LE(0);
    console.log('Channel count:', channelCount);
    
    // Parse channels
    console.log('\nChannels:');
    if (channelCount === 0) {
      console.log('  (none)');
    } else {
      let offset = 45;
      for (let i = 0; i < Math.min(channelCount, 10); i++) {
        if (offset + 4 > data.length) break;
        const len = data.slice(offset, offset + 4).readUInt32LE(0);
        offset += 4;
        
        if (offset + len > data.length) break;
        const channelId = data.slice(offset, offset + len).toString('utf8');
        console.log(`  ${i+1}. ${channelId}`);
        offset += len;
      }
      
      if (channelCount > 10) {
        console.log(`  ... and ${channelCount - 10} more`);
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkProfile();
