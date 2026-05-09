const { Connection } = require('@solana/web3.js');

async function checkTx() {
  const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
  const sig = 'YgKmU1AoS6RLYZe3XCrfmUfbK4zi9ToVYK2NxgTW5wzajoTBop7Gn7CEkjVmxoC5H2jKUc5Wwobnzv9U1mjjRRB';
  
  console.log('Checking transaction:', sig);
  
  const tx = await connection.getTransaction(sig, { maxSupportedTransactionVersion: 0 });
  
  if (!tx) {
    console.log('❌ Transaction NOT found on blockchain');
    return;
  }
  
  console.log('✅ Transaction FOUND');
  console.log('Status:', tx.meta.err ? '❌ FAILED' : '✅ SUCCESS');
  
  if (tx.meta.logMessages) {
    console.log('\nLogs:');
    tx.meta.logMessages.forEach((log, i) => {
      if (log.includes('Deposited') || log.includes('error') || log.includes('Error')) {
        console.log(`  ${log}`);
      }
    });
  }
}

checkTx();
