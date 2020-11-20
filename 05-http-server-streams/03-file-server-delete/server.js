const url = require('url');
const http = require('http');
const path = require('path');
const {unlink} = require('fs');

const server = new http.Server();

server.on('request', (req, res) => {
  const pathname = url.parse(req.url).pathname.slice(1);

  if (pathname.includes('/')) {
    res.statusCode = 400;
    res.end('Nested path');
  }
  const filepath = path.join(__dirname, 'files', pathname);

  switch (req.method) {
    case 'DELETE':
      new Promise((resolve, reject) => {
        fs.stat(filepath, (err) => {
          if (err && err.code === 'ENOENT') {
            res.statusCode = 404;
            return res.end('File doesnt exist');
          }
          if (err == null) return resolve();
        });
      }).then(() => {
        unlink(filepath, () => {
          res.statusCode = 200;
          return res.end('Success');
        });
      });

      break;

    default:
      res.statusCode = 501;
      res.end('Not implemented');
  }
});

module.exports = server;
