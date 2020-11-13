const http = require('http')
const fs = require('fs')
const path = require('path')
const url = require('url');

const wwwFiles = {
    'index.html': fs.readFileSync('./www/index.html'),
    'index.js': fs.readFileSync('./www/index.js'),
    'index.css': fs.readFileSync('./www/index.css'),
    'favicon.ico': fs.readFileSync('./www/favicon.ico'),
}
const fileMap = {
    '': 'index.html',
    '/': 'index.html',
}
const mime = p => ({
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/x-javascript'
} [path.extname(p)] || 'text/plain');

const server = http.createServer()
server.on('request', function (req, resp) {
    // POWERED
    resp.setHeader('X-Powered-By', 'watch_dog_v1');

    const urlOpt = url.parse(req.url, true);
    if (urlOpt.pathname in fileMap) {
        return RFile(resp, fileMap[urlOpt.pathname]);
    } else if (urlOpt.pathname.slice(1) in wwwFiles) {
        const filename = urlOpt.pathname.slice(1).trim();
        return RFile(resp, filename);
    } else if (urlOpt.pathname.startsWith('/app/')) {
        return runapi(req, resp);
    }
    return R404(resp);
})

server.listen(9901, function () {
    console.log('woof~woof,woof,woof. http://127.0.0.1:9901/index.html')
})

function RFile(resp, filename) {
    resp.setHeader('Content-Type', `${mime(filename)}; charset=utf-8`)
    resp.write(wwwFiles[filename]);
    return resp.end();
}

function R404(resp, msg = '') {
    resp.writeHead(404, {
        "Content-Type": "text/plain; charset=utf-8"
    });
    resp.write("404 Not Found\n" + msg);
    resp.end();
}

function R_JSON(resp, obj) {
    resp.writeHead(200, {
        "Content-Type": "application/json; charset=utf-8"
    });
    resp.write(JSON.stringify(obj));
    resp.end();
}
const watched = new Set();

function watchModule(pth) {
    if (watched.has(pth)) return;
    watched.add(pth);
    fs.watchFile(path.resolve(pth), () => {
        delete require.cache[require.resolve(pth)]
    })
}

function isFunc(functionToCheck) {
    return typeof functionToCheck === 'function';
}

function faas_require(pth) {
    const {
        query,
        pathname,
        search,
        host
    } = url.parse(pth, true);
    const basename = path.basename(pathname);
    const extname = path.extname(pathname);
    if (extname !== '.js' && extname !== '') {
        return null;
    }

    const fsPth = `./app/${basename}${extname ? extname : '.js'}`;
    if (!fs.existsSync(path.join(__dirname, fsPth))) {
        return null;
    }
    watchModule(fsPth);
    return require(fsPth);
}

async function runapi(req, resp) {
    const {
        query,
        pathname,
        search,
        host,
        body,
        json
    } = await parseRequest(req);

    // loadjs in sandbox
    const app = faas_require(req.url);
    if (!isFunc(app)) {
        return R404(resp, 'is not function');
    }
    const start = Date.now();
    try {
        const result = await app.call({
            use: faas_require,
            req,
            __rootdirname___: __dirname
        }, {
            ...query,
            ...json
        });
        const usetime = Date.now() - start;
        return R_JSON(resp, {
            result,
            usetime
        })
    } catch (error) {
        return R_JSON(resp, {
            result: null,
            usetime: -1,
            msg: error.message
        })
    }
}

async function parseRequest(req) {
    const {
        headers,
        method
    } = req;
    const {
        query,
        pathname,
        search,
        host
    } = url.parse(req.url, true);
    let body = '';
    let json = {};
    if (method === 'POST' && headers['content-type'] === 'application/json') {
        body = await getBody(req);
        try {
            json = JSON.parse(body);
        } catch (error) {
            // pass
        }
    }
    return {
        query,
        pathname,
        search,
        host,
        body,
        json,
        url: req.url,
        headers
    };
}

function getBody(request) {
    let body = [];
    return new Promise((resolve, reject) => {
        request.on('error', (err) => {
            console.error(err);
            return resolve('');
        }).on('data', (chunk) => {
            body.push(chunk);
        }).on('end', () => {
            body = Buffer.concat(body).toString();
            return resolve(body);
        });
    })
}