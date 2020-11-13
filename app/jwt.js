const jwt = require('jwt-simple');

const secret = '__wetch_dog__';
console.log('[jwt] loaded!');

module.exports = function (query = {}) {
  const payload = query;
  return jwt.encode(payload, secret);
}