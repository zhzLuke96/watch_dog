const delay = (ms = 1000) => new Promise((r) => setTimeout(r, ms));

console.log('[add] loaded! 🎉');

module.exports = async function ({
    a = 0,
    b = 0,
    ms = 0,
    msg
}) {
    const {
        use
    } = this;
    const logger = use('/logger');
    logger.call(this, {
        msg
    });
    const ctx = use('ctx');
    const last_a = await ctx.call(this, {
        path: 'add_app_last_A',
    });
    const last_b = await ctx.call(this, {
        path: 'add_app_last_B',
    });
    logger.call(this, {
        msg: JSON.stringify({
            last_a,
            last_b
        })
    });
    ctx.call(this, {
        path: 'add_app_last_A',
        value: a,
        method: 'set'
    });
    ctx.call(this, {
        path: 'add_app_last_B',
        value: b,
        method: 'set'
    });
    await delay(Number(ms));

    return Number(a) + Number(b);
}