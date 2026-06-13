import casper from 'casper-js-sdk';
import fs from 'fs';

const pem = fs.readFileSync('../keys/deployer.pem', 'utf8');
const pk = casper.PrivateKey.fromPem(pem);
console.log('Public key hex:', pk.toPublicKey().toHex());
