fetch('https://typex-uz.vercel.app/')
  .then(r => r.text())
  .then(html => {
    const match = html.match(/src="(\/js\/typeuz.[^"]*.js)"/);
    return fetch('https://typex-uz.vercel.app' + match[1]);
  })
  .then(r => r.text())
  .then(js => {
    // Find the backendUrl near recaptchaSiteKey
    const match = js.match(/backendUrl:"([^"]+)"/);
    console.log('backendUrl in Vercel is:', match ? match[1] : 'not found');
  })
  .catch(console.error);
