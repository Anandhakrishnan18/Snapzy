const fs = require('fs');
const path = require('path');
const files = [
  'pages/Profile.jsx',
  'pages/Notifications.jsx',
  'pages/Messages.jsx',
  'pages/Home.jsx',
  'context/SocketContext.jsx',
  'components/Post.jsx'
];
files.forEach(f => {
  const p = path.join(__dirname, 'frontend/src', f);
  let c = fs.readFileSync(p, 'utf8');
  fs.writeFileSync(p, c.replace(/5000/g, '5001'));
});
