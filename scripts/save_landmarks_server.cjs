const http = require('http');
const fs = require('fs');
const path = require('path');

const outputPath = path.join(__dirname, '..', 'data', 'isl-landmarks', 'Normalized_Gesture_Landmarks.csv');

const server = http.createServer((req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.method === 'POST' && req.url === '/save') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', () => {
      try {
        console.log(`Received landmarks data. Length: ${body.length} bytes.`);
        fs.mkdirSync(path.dirname(outputPath), { recursive: true });
        fs.writeFileSync(outputPath, body);
        console.log(`Successfully saved normalized landmarks to: ${outputPath}`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'success' }));
        
        // Gracefully shut down the server in 1 second
        setTimeout(() => {
          console.log('Shutting down server...');
          process.exit(0);
        }, 1000);
      } catch (err) {
        console.error('Error saving file:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'error', message: err.message }));
      }
    });
  } else {
    res.writeHead(404);
    res.end();
  }
});

server.listen(3001, () => {
  console.log('Temporary save server running on http://localhost:3001');
});
