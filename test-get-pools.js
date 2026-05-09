const { Connection } = require('@solana/web3.js');
const fs = require('fs');

// We copy the exact logic from lib/solana.ts to see what accounts it extracts
async function run() {
  const connection = new Connection('https://api.devnet.solana.com');
  const accounts = await connection.getProgramAccounts(require('@solana/web3.js').PublicKey.default || new require('@solana/web3.js').PublicKey('J45dp2TMQXx5v5RDygsF3im7URJqu7QQ996V1kqXeNxN'), {
      encoding: 'base64',
  });
  console.log("Total accounts:", accounts.length);
  
  let validPools = 0;
  for (const acc of accounts) {
    const rawData = acc.account.data;
    if (rawData.length < 8) continue;
    const discriminator = Array.from(rawData.slice(0, 8));
    const VIDEO_POOL_DISCRIMINATOR = [133, 206, 71, 13, 121, 10, 79, 129];
    if (!VIDEO_POOL_DISCRIMINATOR.every((b, i) => b === discriminator[i])) continue;
    
    console.log("Found VideoPool. Size:", rawData.length);
    try {
      const data = rawData.slice(8);
      const readUInt32LE = (d, o) => d[o] | (d[o+1]<<8) | (d[o+2]<<16) | (d[o+3]<<24);
      const videoIdLen = readUInt32LE(data, 32);
      console.log("videoIdLen:", videoIdLen);
      const videoIdBytes = data.slice(36, 36 + videoIdLen);
      const currentOffset = 36 + videoIdLen;
      console.log("currentOffset:", currentOffset);
      const status = data[currentOffset + 46];
      console.log("status:", status);
      validPools++;
    } catch(e) {
      console.log("Error parsing:", e);
    }
  }
  console.log("Valid pools parsed:", validPools);
}
run();
