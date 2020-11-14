const jwt = require('jwt-simple');

const secret = '__wetch_dog__';
console.log('[jwt_decoder] loaded!');

module.exports = function ({
  token
}) {
  try {
    return {
      payload: jwt.decode(token, secret)
    };
  } catch (error) {
    return {
      payload: null,
      err: 'not authenticated'
    };
  }
}