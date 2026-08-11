fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
  headers: { Authorization: "Bearer INVALID_TOKEN" },
}).then((r) => console.log(r.status));
