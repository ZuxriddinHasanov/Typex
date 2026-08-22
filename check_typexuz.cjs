fetch('https://typex.uz/')
  .then(r => r.text())
  .then(html => {
    const match = html.match(/src="(\/js\/typeuz.[^"]*.js)"/);
    if (!match) return console.log('No JS bundle found');
    return fetch('https://typex.uz' + match[1]);
  })
  .then(r => r.text())
  .then(js => {
    const backendMatch = js.match(/[a-zA-Z_$]+(?:\.[a-zA-Z_$]+)*=["'](https?:\/\/[^"']+)["']/g);
    if (backendMatch) {
      console.log('Found backend URLs:', backendMatch.filter(u => u.includes('type') || u.includes('backend')));
    }
  })
  .catch(console.error);
