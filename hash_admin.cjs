const bcrypt = require('bcryptjs');

const username = 'admin';
const password = 'TypexAdmin#2026!Secure';

async function generate() {
  const hash = await bcrypt.hash(password, 10);
  console.log('Username:', username);
  console.log('Password:', password);
  console.log('Hash:', hash);
}
generate();
