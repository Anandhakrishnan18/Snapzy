const http = require('http');

const req = http.request('http://localhost:5001/api/auth/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
}, (res) => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    console.log('Status Code:', res.statusCode);
    console.log('Response Body:', d);
  });
});

req.on('error', console.error);

req.write(JSON.stringify({
  userId: 'testuser1',
  username: 'Test User',
  email: 'test1@example.com',
  password: 'password123'
}));

req.end();
