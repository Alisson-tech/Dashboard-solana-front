const { Connection } = require('@solana/web3.js');

async function checkTx() {
  const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
  const sig = '5sDnFjexQug8LnwdfqCGPZcgknkxbjZeFGgGqNzSf9CQ5MFNYbisn4itzqhqnJq8DRcoTXbWzpqBWMdHnzLaXGaS';
  
  console.log('Checking transaction:', sig);
  console.log('');
  
  try {
    const tx = await connection.getTransaction(sig, { maxSupportedTransactionVersion: 0 });
    
    if (!tx) {
      console.log('❌ Transaction NOT found on blockchain');
      console.log('Possible reasons:');
      console.log('  - Still pending (not yet confirmed)');
      console.log('  - Failed to send');
      console.log('  - Different network/cluster');
      return;
    }
    
    console.log('✅ Transaction FOUND!');
    console.log('Slot:', tx.slot);
    console.log('Block time:', new Date(tx.blockTime * 1000).toISOString());
    console.log('');
    
    if (tx.meta) {
      console.log('Status:', tx.meta.err ? '❌ FAILED' : '✅ SUCCESS');
      if (tx.meta.err) {
        console.log('Error:', tx.meta.err);
      }
      console.log('Logs:');
      if (tx.meta.logMessages) {
        tx.meta.logMessages.forEach((log, i) => {
          console.log(`  ${i+1}. ${log}`);
        });
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkTx();
