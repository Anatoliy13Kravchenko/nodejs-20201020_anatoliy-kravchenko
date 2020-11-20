const url = require('url');
const http = require('http');
const path = require('path');
const fs = require('fs');
const {pipeline} = require('stream');
const LimitSizeStream = require('./LimitSizeStream.js');
const server = new http.Server();

server.on('request', (req, res) => {
  const pathname = url.parse(req.url).pathname.slice(1);
  const filepath = path.join(__dirname, 'files', pathname);
  const limit = 1024 * 1024;
  const limitSizeStream = new LimitSizeStream({limit, encoding: 'utf8'});

  res.setHeader('Content-Type', 'text/plain');

  switch (req.method) {
    case 'POST':
      new Promise((resolve, reject) => {
        if (pathname.includes('/')) {
          const error = new Error('Nested path');
          error.code = 'NESTED_PATH';
          return reject(error);
        }

        limitSizeStream.on('error', (error) => {
          fs.unlink(filepath, () => {
            console.log(`${filepath} was deleted because of ${error.message}`);
          });
          res.statusCode = 413;
          res.end(error.message);
          reject(error);
        });

        fs.stat(filepath, (err) => {
          if (err && err.code === 'ENOENT') {
            return pipeline(req, limitSizeStream, fs.createWriteStream(filepath),
                (e) => e == null ? resolve() : reject(e));
          }
          if (err == null) {
            const error = new Error('File already exist!');
            error.code = 'FILE_ALREADY_EXIST';
            return reject(error);
          }
          reject(err);
        });
      })
          .then(() => {
            res.statusCode = 201;
            res.end('Data successfully saved!');
          }).catch((error) => {
            if (error.code === 'NESTED_PATH') {
              res.statusCode = 400;
              res.end(error.message);
              return;
            }
            if (error.code === 'ENOENT') {
              res.statusCode = 404;
              res.end(error.message);
              return;
            }
            if (error.code === 'FILE_ALREADY_EXIST') {
              res.statusCode = 409;
              res.end(error.message);
              return;
            }
            // TODO Why wasn't caught by pipline catch???
            // if (error.code === 'LIMIT_EXCEEDED') {
            //   res.statusCode = 413;
            //   res.end(error.message);
            //   fs.unlink(filepath, () => {
            //     console.log(`${filepath} was deleted because of ${error.message}`);
            //   });
            //   return;
            // }
            if (error.code === 'ECONNRESET') {
              fs.unlink(filepath, () => {
                console.log(`${filepath} was deleted because of ${error.message}`);
              });
              return;
            }

            res.statusCode = 500;
            res.end('Server error');
          });
      break;

    default:
      res.statusCode = 501;
      res.end('Not implemented');
  }
});

module.exports = server;
