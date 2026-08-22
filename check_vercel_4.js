fetch('https://typex-uz.vercel.app/')
  .then(r => r.text())
  .then(html => {
    const match = html.match(/src="(\/js\/typeuz.[^"]*.js)"/);
    return fetch('https://typex-uz.vercel.app' + match[1]);
  })
  .then(r => r.text())
  .then(js => {
    console.log('Has api.typex.uz:', js.includes('api.typex.uz'));
    const backendMatch = js.match(/[a-zA-Z_$]+(?:\.[a-zA-Z_$]+)*=["']https?:\/\/[^"']+["']/g);
    if (backendMatch) {
      console.log('Found URLs:', backendMatch.slice(0, 10));
    }
  })
  .catch(console.error);
