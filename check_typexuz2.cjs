fetch('https://typex.uz/')
  .then(r => r.text())
  .then(html => {
    const match = html.match(/src="(\/js\/typeuz.[^"]*.js)"/);
    if (!match) return console.log('No JS bundle found');
    return fetch('https://typex.uz' + match[1]);
  })
  .then(r => r.text())
  .then(js => {
    console.log('typex.uz JS contains api.typex.uz:', js.includes('api.typex.uz'));
    console.log('typex.uz JS contains typex-backend-yrvx:', js.includes('typex-backend-yrvx.onrender.com'));
  })
  .catch(console.error);
