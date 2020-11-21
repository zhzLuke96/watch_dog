const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const {
    isFunc,
    RFile,
    R404,
    R_JSON,
    hotloadModule,
    moduleGC,
    requireMap,
    apiList,
    wwwFiles,
    resetMoudles
} = require('./common.js');

// 😀 config file 😀
let watch_dog_config = require('./watch_dog.config.json');

;
(() => {
    const MIN_TIMEOUT = 1000 * 60 * 0.618;

    watch_dog_config.servername = watch_dog_config.servername || 'watch_dog';
    watch_dog_config.api_prefix = watch_dog_config.api_prefix || '/app/';
    if (watch_dog_config.module_GC_timeout < MIN_TIMEOUT) {
        watch_dog_config.module_GC_timeout = MIN_TIMEOUT;
    }
    // workshopdir
    if (watch_dog_config.workshopdir) {
        if (!path.isAbsolute(watch_dog_config.workshopdir)) {
            watch_dog_config.workshopdir = path.join(__dirname, watch_dog_config.workshopdir);
        }
    }
    watch_dog_config = Object.freeze(watch_dog_config);
})();
const app_dirname = './app/';
const fileMap = {
    '': 'index.html',
    '/': 'index.html',
}

const server = http.createServer()
server.on('request', function (req, resp) {
    // POWERED
    resp.setHeader('X-Powered-By', watch_dog_config.servername);

    const urlOpt = url.parse(req.url, true);
    if (urlOpt.pathname in fileMap) {
        return RFile(resp, fileMap[urlOpt.pathname]);
    } else if (urlOpt.pathname.slice(1) in wwwFiles) {
        const filename = urlOpt.pathname.slice(1).trim();
        return RFile(resp, filename);
    } else if (urlOpt.pathname === '/apis') {
        return R_JSON(resp, {
            result: apiList()
        })
    } else if (urlOpt.pathname.startsWith(watch_dog_config.api_prefix)) {
        return runapp(req, resp);
    }
    return R404(resp);
})

server.listen(9901, function () {
    console.log('woof~woof,woof,woof. http://127.0.0.1:9901/index.html')
})

function faas_require(pth) {
    const {
        query,
        pathname,
        search,
        host
    } = url.parse(pth, true);
    const {
        dir,
        base,
        ext
    } = path.parse(pathname.replace(watch_dog_config.api_prefix, ''));
    if (ext !== '.js' && ext !== '') {
        return noop;
    }
    const fsPth = `${app_dirname}${dir ? dir + '/' : ''}${base}${ext ? ext : '.js'}`;
    if (requireMap.has(fsPth)) {
        return requireMap.get(fsPth);
    }
    if (!fs.existsSync(path.join(__dirname, fsPth))) {
        return noop;
    }
    hotloadModule(fsPth);
    const m = require(fsPth);
    setTimeout(() => moduleGC(fsPth, '[TIMEOUT]'), watch_dog_config.module_GC_timeout);
    requireMap.set(fsPth, m);
    return m;
}

async function runapp(req, resp) {
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
            __rootdir__: __dirname,
            __workshopdir__: watch_dog_config.workshopdir || __dirname
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
    if (method === 'POST') {
        if (headers['content-type'] === 'application/json') {
            body = await getBody(req);
            try {
                json = JSON.parse(body);
            } catch (error) {
                // pass
            }
        } else if (headers['content-type'] === 'multipart/form-data') {
            // TODO: 读取文件
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
            request = null; // GC
            return resolve('');
        }).on('data', (chunk) => {
            body.push(chunk);
        }).on('end', () => {
            body = Buffer.concat(body).toString();
            request = null; // GC
            return resolve(body);
        });
    })
}