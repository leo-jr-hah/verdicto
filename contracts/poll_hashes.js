const fs = require('fs');

const RPC_URL = 'https://node.testnet.cspr.cloud/rpc';
const CSPR_CLOUD_KEY = '019ebc82-9e2d-7ea2-8f4c-167b74097107';

const deploys = {
  VOTING: 'b4de33365b309a5595dc5e59a63778f7ca43d5fce8e8b8a84253dd48a45549cc',
  REPUTATION: '7193827d438db680005480ecf18b2b3b9feaa1d0c608a4d45848f3a66ee800dc'
};

async function getDeploy(hash) {
  const payload = {
    jsonrpc: '2.0',
    id: 1,
    method: 'info_get_deploy',
    params: { deploy_hash: hash }
  };
  const res = await fetch(RPC_URL, {
    method: 'POST',
    headers: { 'Authorization': CSPR_CLOUD_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  return data.result && data.result.execution_results ? data.result.execution_results : [];
}

async function run() {
  for (const [name, hash] of Object.entries(deploys)) {
    let results = [];
    while (results.length === 0) {
      console.log(`Polling ${name}...`);
      results = await getDeploy(hash);
      if (results.length === 0) await new Promise(r => setTimeout(r, 5000));
    }
    
    const result = results[0].result;
    if (result.Success) {
      const transforms = result.Success.effect.transforms;
      const contractHash = transforms.find(t => t.transform.WriteContract)?.key;
      const packageHash = transforms.find(t => t.transform.WriteContractPackage)?.key;
      console.log(`${name}_CONTRACT_HASH=${contractHash}`);
      console.log(`${name}_PACKAGE_HASH=${packageHash}`);
    } else {
      console.log(`${name} Failed:`, result.Failure.error_message);
    }
  }
}

run();
