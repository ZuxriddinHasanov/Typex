fetch('https://typex-uz.vercel.app/')
  .then(r => r.text())
  .then(html => {
    const match = html.match(/src="(\/js\/typeuz.[^"]*.js)"/);
    return fetch('https://typex-uz.vercel.app' + match[1]);
  })
  .then(r => r.text())
  .then(js => {
    console.log('Has api.typeuz.uz:', js.includes('api.typeuz.uz'));
  })
  .catch(console.error);
