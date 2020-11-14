console.log('[sysusage] loaded!');
const os = require('os');

module.exports = async function (query = {}) {
  const {
    rss,
    heapTotal,
    external,
    arrayBuffers
  } = process.memoryUsage();
  return {
    mem: {
      rss,
      heapTotal,
      external,
      arrayBuffers,
      usage: rss / os.totalmem()
    },
    cpu: {
      usage: await OSUtils.getCPUUsage(100)
    }
  };
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

class OSUtils {
  static cpuUsageMSDefault = 1000
  /**
   * 获取某时间段 CPU 利用率
   * @param { Number } Options.ms [时间段，默认是 1000ms，即 1 秒钟]
   * @param { Boolean } Options.percentage [true（以百分比结果返回）|false] 
   * @returns { Promise }
   */
  static async getCPUUsage(cpuUsageMS = OSUtils.cpuUsageMSDefault, percentage = false) {
    const t1 = OSUtils._getCPUInfo(); // t1 时间点 CPU 信息

    await sleep(cpuUsageMS);

    const t2 = OSUtils._getCPUInfo(); // t2 时间点 CPU 信息
    const idle = t2.idle - t1.idle;
    const total = t2.total - t1.total;
    const usage = 1 - idle / total;

    if (!percentage) return usage;
    return (usage * 100.0).toFixed(2) + "%";
  }

  /**
   * 获取 CPU 信息
   * @returns { Object } CPU 信息
   */
  static _getCPUInfo() {
    const cpus = os.cpus();
    let user = 0,
      nice = 0,
      sys = 0,
      idle = 0,
      irq = 0,
      total = 0;

    for (let cpu in cpus) {
      const times = cpus[cpu].times;
      user += times.user;
      nice += times.nice;
      sys += times.sys;
      idle += times.idle;
      irq += times.irq;
    }

    total += user + nice + sys + idle + irq;

    return {
      user,
      sys,
      idle,
      total,
    }
  }
}