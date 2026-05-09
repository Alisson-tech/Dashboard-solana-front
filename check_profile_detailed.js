const { Connection, PublicKey } = require('@solana/web3.js');

async function checkProfile() {
  const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
  const wallet = new PublicKey('AStfJETXKGY9aHXr9PVMSWck6htEW6zQyA9BftpC3qaB');
  const PROGRAM_ID = new PublicKey('J45dp2TMQXx5v5RDygsF3im7URJqu7QQ996V1kqXeNxN');
  
  const [profilePDA] = PublicKey.findProgramAddressSync(
    [Buffer.from('user_profile'), wallet.toBuffer()],
    PROGRAM_ID
  );
  
  console.log('Profile PDA:', profilePDA.toBase58());
  
  const accountInfo = await connection.getAccountInfo(profilePDA);
  const data = accountInfo.data;
  
  console.log('\n=== Raw Data Analysis ===');
  console.log('Total size:', data.length, 'bytes');
  console.log('First 160 bytes (hex):\n', data.slice(0, 160).toString('hex'));
  console.log('\nFirst 160 bytes (as numbers):\n', Array.from(data.slice(0, 160)));
  
  // Standard structure for UserProfile:
  // [0-7] discriminator
  // [8-39] authority (32 bytes)
  // [40] role (1 byte)
  // [41-44] is_banned (4 bytes?)
  // [45+] channel_ids (Vec<String>)
  
  console.log('\n=== Parsed Structure ===');
  console.log('Discriminator (0-8):', Array.from(data.slice(0, 8)).join(','));
  console.log('Authority (8-40):', new PublicKey(data.slice(8, 40)).toBase58());
  console.log('Role byte (40):', data[40], '-> ', data[40] === 0 ? 'creator' : data[40] === 1 ? 'editor' : 'unknown');
  
  // Try to find where vector data starts
  console.log('\nSearching for channel data...');
  console.log('Byte at 41:', data[41]);
  console.log('Byte at 42:', data[42]);
  console.log('Byte at 43:', data[43]);
  console.log('Byte at 44:', data[44]);
  console.log('Bytes 41-45 as u32LE:', data.slice(41, 45).readUInt32LE(0));
  
  // Check if there's a vec length at a different offset
  console.log('\nLooking for vec length markers...');
  for (let i = 41; i < Math.min(100, data.length - 3); i++) {
    const len = data.slice(i, i+4).readUInt32LE(0);
    if (len > 0 && len < 100) {
      console.log(`  Offset ${i}: value=${len}`);
    }
  }
  
  // Look at the end of the data too
  console.log('\nLast 100 bytes:');
  console.log(data.slice(Math.max(0, data.length - 100)).toString('hex'));
}

checkProfile();
