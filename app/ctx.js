const path = require('path');
const fs = require('fs');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

let db = null;
console.log('[ctx] loaded!');

module.exports = async function (params) {
  const {
    path,
    value,
    find,
    method = 'get'
  } = params;
  if (typeof path !== 'string' || path === '') {
    return 'path must string';
  }
  const {
    __rootdir__,
    __workshopdir__
  } = this;
  mustdir(__workshopdir__ || __rootdir__)
  mustdb(__workshopdir__ || __rootdir__);
  switch (method) {
    case 'get': {
      if ('find' in params) {
        return db.get(path).find(find).value();
      }
      return db.get(path).value();
    }
    case 'set': {
      if ('value' in params) {
        db.set(path, value).write();
        return value;
      }
    }
    default: {
      return 'unknown method';
    }
  }
}

function mustdb(dirname) {
  if (db) return;
  const adapter = new FileSync(path.join(dirname, './ctx_db.json'), {
    serialize: (data) => JSON.stringify(data),
    deserialize: (data) => JSON.parse(data)
  });
  db = low(adapter);
}

function mustdir(dirname) {
  if (!fs.existsSync(dirname)) {
    fs.mkdirSync(dirname);
  }
}