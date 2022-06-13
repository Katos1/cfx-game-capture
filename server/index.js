const http = require('http');
const fs = require('fs');

const httpServer = http.createServer();

function generateShortId() {
  return Math.random().toString(16).slice(2);
}

httpServer.on('request', (req, res) => {
  const fileName = `./files/${generateShortId()}.webm`;
  const body = [];

  req.on('data', (chunk) => chunk && body.push(chunk));

  req.on('end', () => {
    const data = Buffer.concat(body).toString();
    const video = data.split(';base64,').pop();

    fs.writeFileSync(fileName, video, { encoding: 'base64' });
  });

  res.end('done');
});

httpServer.listen(5560);
