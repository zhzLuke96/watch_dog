const {
  mustdir,
  mustReadOnlyDB
} = require('../../app_utils/db');

let db = null;
console.log('[@ctx/get] loaded! 🎉');

module.exports = async function ({
  code = 'null',
}) {
  const {
    use,
    __rootdir__,
    __workshopdir__,
  } = this;
  if (!db) {
    db = mustReadOnlyDB(__workshopdir__ || __rootdir__);
  }
  const vm = use("@sandbox/vm");
  return await vm.call(this, {
    code: `return ${code};`,
    context: {
      db
    }
  });
  return eval(code);
}