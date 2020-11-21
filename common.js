const fs = require('fs');
const path = require('path');

// ref: https://stackoverflow.com/a/14801711 👇
/**
 * Removes a module from the cache
 */
function purgeCache(moduleName) {
  // Traverse the cache looking for the files
  // loaded by the specified module name
  searchCache(moduleName, function (mod) {
    delete require.cache[mod.id];
  });

  // Remove cached paths to the module.
  // Thanks to @bentael for pointing this out.
  Object.keys(module.constructor._pathCache).forEach(function (cacheKey) {
    if (cacheKey.indexOf(moduleName) > 0) {
      delete module.constructor._pathCache[cacheKey];
    }
  });
};

/**
 * Traverses the cache to search for all the cached
 * files of the specified module name
 */
function searchCache(moduleName, callback) {
  // Resolve the module identified by the specified name
  var mod = require.resolve(moduleName);

  // Check if the module has been resolved and found within
  // the cache
  if (mod && ((mod = require.cache[mod]) !== undefined)) {
    // Recursively go over the results
    (function traverse(mod) {
      // Go over each of the module's children and
      // traverse them
      mod.children.forEach(function (child) {
        traverse(child);
      });

      // Call the specified callback providing the
      // found cached module
      callback(mod);
    }(mod));
  }
};
// ref: https://stackoverflow.com/a/14801711 👆

const mime = p => ({
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/x-javascript'
} [path.extname(p)] || 'text/plain');


const wwwFiles = {
  'index.html': fs.readFileSync('./www/index.html'),
  'index.js': fs.readFileSync('./www/index.js'),
  'index.css': fs.readFileSync('./www/index.css'),
  'favicon.ico': fs.readFileSync('./www/favicon.ico'),
}

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

const requireMap = new Map();

function hotloadModule(pth) {
  if (requireMap.has(pth)) return;
  fs.watchFile(path.resolve(pth), () => moduleGC(pth, '[FILE_CHANGE]'))
}

function moduleGC(pth, msg) {
  purgeCache(pth);
  if (requireMap.has(pth)) {
    requireMap.get(pth).onDestroy && requireMap.get(pth).onDestroy();
  }
  requireMap.delete(pth);
  console.log('[MODULE_GC]', msg, pth);
}

function* travelDir(dir) {
  if (!fs.existsSync(dir)) {
    return
  }
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const pathname = path.join(dir, file)
    if (fs.statSync(pathname).isDirectory()) {
      yield* travelDir(pathname)
    } else {
      yield pathname;
    }
  }
}
let apiList_cached = null;
const apiList = (appDirname = './app/', force = false) => {
  if (!force && apiList_cached !== null) {
    return apiList_cached;
  }
  const apis = [];
  for (const filename of travelDir(appDirname)) {
    const {
      ext
    } = path.parse(filename);
    if (ext === '.js') {
      const apipath = filename
        .replace(new RegExp(`${ext}$`), '')
        .replace(/\\/g, '/');
      apis.push(apipath);
    }
  }
  apiList_cached = apis;
  return apis;
}

module.exports = {
  mime,
  noop: x => x,
  isFunc: funcMaybe => funcMaybe && typeof funcMaybe === 'function',
  RFile,
  R404,
  R_JSON,
  hotloadModule,
  moduleGC,
  requireMap,
  travelDir,
  apiList,
  wwwFiles,
  resetMoudles() {
    Object.keys(require.cache)
      .map(purgeCache)
  }
};