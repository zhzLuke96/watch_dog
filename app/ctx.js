const {
  mustdir,
  mustdb
} = require('../app_utils/db');

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
  if (!db) {
    db = mustdb(__workshopdir__ || __rootdir__);
  }
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