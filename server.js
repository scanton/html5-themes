const http = require('http');
const fs   = require('fs');
const path = require('path');

const PORT = 3011;
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
};

http.createServer((req, res) => {
  const url      = req.url === '/' ? '/index.html' : req.url;
  const filePath = path.join(__dirname, url);
  const ext      = path.extname(filePath);

  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'text/plain' });
    res.end(data);
  });
}).listen(PORT, () => {
  console.log(`Gradient Styles Demo → http://localhost:${PORT}`);
});
