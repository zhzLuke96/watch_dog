const path = require('path');
const fs = require('fs');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

module.exports = {
  mustdb,
  mustdir,
  mustReadOnlyDB
}

const FILE_NAME = 'ctx_db.json';

let db = null;

function mustdb(dirname) {
  if (db) return db;
  mustdir(dirname);
  const adapter = new FileSync(path.join(dirname, FILE_NAME), {
    serialize: (data) => JSON.stringify(data),
    deserialize: (data) => JSON.parse(data)
  });
  db = low(adapter);
  return db;
}

function mustdir(dirname) {
  if (!fs.existsSync(dirname)) {
    fs.mkdirSync(dirname);
  }
}

const ReadOnlyify = olddb => {
  const newdb = Object.create(olddb);
  newdb.set = () => newdb.set();
  newdb.defaults = () => newdb;
  newdb.write = () => newdb;
  return newdb;
}

let readonlyDB = null;

function mustReadOnlyDB(dirname) {
  if (readonlyDB) return readonlyDB;
  mustdir(dirname);
  const adapter = new FileSync(path.join(dirname, FILE_NAME), {
    serialize: (data) => JSON.stringify(data),
    deserialize: (data) => JSON.parse(data)
  });
  readonlyDB = ReadOnlyify(low(adapter));
  return readonlyDB;
}