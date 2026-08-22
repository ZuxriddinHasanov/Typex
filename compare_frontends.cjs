const https = require('https');

async function getBackend(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const match = data.match(/src="(\/js\/typeuz.[^"]*.js)"/);
        if (!match) return resolve('No JS found');
        
        const jsUrl = new URL(match[1], url).toString();
        https.get(jsUrl, (jsRes) => {
          let jsData = '';
          jsRes.on('data', chunk => jsData += chunk);
          jsRes.on('end', () => {
            const hasRender = jsData.includes('typex-backend-yrvx.onrender.com');
            const hasApi = jsData.includes('api.typex.uz');
            resolve({ hasRender, hasApi });
          });
        });
      });
    }).on('error', reject);
  });
}

async function run() {
  console.log('typex.uz:', await getBackend('https://typex.uz/'));
  console.log('typex-uz.vercel.app:', await getBackend('https://typex-uz.vercel.app/'));
}
run();
