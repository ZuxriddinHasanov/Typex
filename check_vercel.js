fetch('https://typex-uz.vercel.app/')
  .then(r => r.text())
  .then(html => {
    const match = html.match(/src="(\/js\/typeuz.[^"]*.js)"/);
    if (!match) return console.log('No JS bundle found');
    return fetch('https://typex-uz.vercel.app' + match[1]);
  })
  .then(r => r.text())
  .then(js => {
    console.log('Has api.typex.uz:', js.includes('https://api.typex.uz'));
    console.log('Has Render:', js.includes('typex-backend-yrvx.onrender.com'));
  })
  .catch(console.error);
