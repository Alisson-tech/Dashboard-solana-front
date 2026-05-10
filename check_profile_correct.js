const { Connection, PublicKey } = require('@solana/web3.js');

async function checkProfile() {
  const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
  const wallet = new PublicKey('AStfJETXKGY9aHXr9PVMSWck6htEW6zQyA9BftpC3qaB');
  const PROGRAM_ID = new PublicKey('J45dp2TMQXx5v5RDygsF3im7URJqu7QQ996V1kqXeNxN');
  
  const [profilePDA] = PublicKey.findProgramAddressSync(
    [Buffer.from('user_profile'), wallet.toBuffer()],
    PROGRAM_ID
  );
  
  const accountInfo = await connection.getAccountInfo(profilePDA);
  const data = accountInfo.data;
  
  console.log('=== PROFILE DATA ===\n');
  console.log('✅ Profile exists');
  console.log('Authority:', new PublicKey(data.slice(8, 40)).toBase58());
  console.log('Role:', data[40] === 1 ? 'editor' : 'creator');
  
  // Parse channels starting at offset 44
  // Format: [4-byte len][string data][4-byte len][string data]...
  console.log('\n=== CHANNELS ===');
  
  let offset = 44;
  let channelIndex = 1;
  
  while (offset < data.length - 3) {
    const len = data.slice(offset, offset + 4).readUInt32LE(0);
    
    // Stop if length seems invalid
    if (len === 0 || len > 1000 || offset + 4 + len > data.length) {
      break;
    }
    
    const channelId = data.slice(offset + 4, offset + 4 + len).toString('utf8');
    console.log(`Channel ${channelIndex}: ${channelId}`);
    
    offset += 4 + len;
    channelIndex++;
  }
  
  if (channelIndex === 1) {
    console.log('(no channels)');
  }
}

checkProfile();
