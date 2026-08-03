const path = require('path');
const http = require('http');
const fs = require('fs');

exports.createServer = function (port, enableAtomics) {
  const rootDir = path.join(__dirname, '..');
  const address = `http://localhost:${port}/`;

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, address);

    if (url.pathname === '/') {
      res.writeHead(301, { Location: '/tests/' });
      return res.end();
    } else if (url.pathname === '/api/cookie') {
      const name = url.searchParams.get('name');
      let date = new Date();
      date.setTime(date.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now
      let expires = date.toUTCString();
      res.writeHead(200, {
        'Set-Cookie': `${name}=1; Path=/; expires=${expires}; SameSite=Lax;`,
        'Access-Control-Allow-Origin': req.headers.origin ? req.headers.origin : '*',
        'Access-Control-Allow-Credentials': 'true',
      });
      return res.end();
    } else if (url.pathname.endsWith('post')) {
      res.writeHead(200);
      let body = '';
      req.setEncoding('utf-8');
      req.on('data', (chunk) => {
        body += chunk;
      });
      req.on('end', () => {
        const postDir = path.join(rootDir, 'tests', 'posts');
        const fileName = `${Math.round(Math.random() * 8999 + 1000)}.js`;
        try {
          fs.mkdirSync(postDir, { recursive: true });
        } catch (e) {}

        fs.writeFileSync(path.join(postDir, fileName), body);
        res.end();
      });
      return;
    }

    const pathName = url.pathname.substring(1);
    let filePath;
    if (pathName.startsWith('~partytown')) {
      filePath = path.join(rootDir, 'lib', pathName.replace('~partytown/', ''));
    } else if (pathName.endsWith('/')) {
      filePath = path.join(rootDir, pathName, 'index.html');
    } else if (pathName.endsWith('favicon.ico')) {
      filePath = path.join(rootDir, 'docs', 'site', 'public', 'favicon.ico');
    } else {
      filePath = path.join(rootDir, pathName);
    }

    if (url.searchParams.has('delay')) {
      await new Promise((resolve) => {
        setTimeout(resolve, url.searchParams.get('delay'));
        res.setHeader('X-DELAY', url.searchParams.get('delay'));
      });
    }

    const readStream = fs.createReadStream(filePath);
    readStream.on('open', () => {
      res.setHeader('Cache-Control', 'max-age=0');
      res.setHeader('Access-Control-Allow-Origin', '*');

      if (enableAtomics || url.searchParams.has('atomics')) {
        if (url.searchParams.get('coep') === 'require-corp') {
          res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
          res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
        } else if (url.searchParams.get('coep') !== 'false') {
          res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
          res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
        }
      }

      switch (path.extname(filePath)) {
        case '.js': {
          res.setHeader('Content-Type', 'application/javascript; charset=UTF-8');
          break;
        }
        case '.gif': {
          res.setHeader('Content-Type', 'image/gif');
          break;
        }
        case '.png': {
          res.setHeader('Content-Type', 'image/png');
          break;
        }
        case '.ico': {
          res.setHeader('Content-Type', 'image/x-icon');
          break;
        }
        default: {
          res.setHeader('Content-Type', 'text/html; charset=UTF-8');
        }
      }
      readStream.pipe(res);
    });

    readStream.on('error', (err) => {
      if (err.code === 'ENOENT') {
        res.writeHead(404);
        res.write(`404: ${filePath}`);
      } else {
        console.error(err);
        res.writeHead(500);
        res.write(String(err));
      }
      res.end();
    });
  });

  return new Promise((resolve, reject) => {
    server.listen(port, (err) => {
      if (err) {
        reject(err);
      } else {
        const rtn = {
          address,
          enableAtomics,
          close() {
            return new Promise((resolve) => {
              server.close(resolve);
            });
          },
        };
        resolve(rtn);
      }
    });
  });
};
