const bcrypt = require('bcryptjs');

const password = process.argv[2];
if (!password) {
  console.error('Usage: node generate-password-hash.js <password>');
  process.exit(1);
}

bcrypt.hash(password, 12).then(hash => {
  console.log('Password:', password);
  console.log('Hash:', hash);
}).catch(err => {
  console.error('Error:', err);
});