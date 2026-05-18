const jwt = require('jsonwebtoken');

const payload = {
  sub: '47ef3538-4b28-421d-a56a-8700ec13e38d',
  email: 'manjunath+5@bitcot.com',
  role: 'USER'
};

const secret = 'your_super_secret_access_key';
const token = jwt.sign(payload, secret, { expiresIn: '1h' });

console.log('--------------------------------------------------');
console.log('Generated JWT Access Token for Testing:');
console.log('--------------------------------------------------');
console.log(token);
console.log('--------------------------------------------------');
