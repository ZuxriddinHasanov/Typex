const https = require('https');

https.get('https://typex.uz/', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const urls = data.match(/https?:\/\/[^\s"']+/g);
    console.log('URLs in typex.uz HTML:', [...new Set(urls)]);
  });
});
