import casper from 'casper-js-sdk';
const keys = Object.keys(casper);
console.log('Deploy:', keys.filter(k => k.toLowerCase().includes('deploy')));
console.log('Client/RPC:', keys.filter(k => k.toLowerCase().includes('client') || k.toLowerCase().includes('rpc') || k.toLowerCase().includes('casper')));
console.log('Key:', keys.filter(k => k.toLowerCase().includes('key') || k.toLowerCase().includes('ed25519')));
console.log('Transfer:', keys.filter(k => k.toLowerCase().includes('transfer')));
