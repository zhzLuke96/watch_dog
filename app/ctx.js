const path = require('path');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

let db = null;
console.log('[ctx] loaded!');

module.exports = async function (params) {
  const {
    path,
    value,
    find
  } = params;
  if (typeof path !== 'string' || path === '') {
    return 'path must string';
  }
  const {
    __rootdirname___
  } = this;
  mustdb(__rootdirname___);
  if ('value' in params) {
    db.set(path, value).write();
    return value;
  }
  if ('find' in params) {
    return db.get(path).find(find).value();
  }
  return db.get(path).value();
}

function mustdb(dirname) {
  if (db) return;
  const adapter = new FileSync(path.join(dirname, './ctx_db.json'), {
    serialize: (data) => JSON.stringify(data),
    deserialize: (data) => JSON.parse(data)
  });
  db = low(adapter);
}