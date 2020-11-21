const {
  Safeify
} = require('safeify');

console.log('[@sandbox/vm] loaded! 🎉');

let vm = new Safeify({
  timeout: 500, //超时时间，默认 50ms
  asyncTimeout: 1000, //包含异步操作的超时时间，默认 500ms
  // quantity: 4, //沙箱进程数量，默认同 CPU 核数
  memoryQuota: 512, //沙箱最大能使用的内存（单位 m），默认 500m
  cpuQuota: 0.8, //沙箱的 cpu 资源配额（百分比），默认 50%
});

module.exports = async function execOnVM({
  code = '',
  context: superCtx = null
}) {
  const {
    use
  } = this;
  const logger = use('logger');
  const log = (...msgs) => logger.call(this, {
    msg: msgs.join(' ')
  })
  log(`code length: ${code.length}`, '[CODE]:', code.slice(0, 32) + (code.length > 32 ? '...' : ''));

  const context = Object.create(superCtx);

  const startTime = Date.now();
  const result = await vm.run(code, context);
  const timestamp = Date.now() - startTime;
  return {
    result,
    timestamp,
    context
  };
}

module.exports.onDestroy = () => {
  vm.destroy();
}