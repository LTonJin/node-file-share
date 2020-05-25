var cors = require('koa2-cors');
const logger = () => {
    return async (ctx, next) => {
        const start = Date.now();
        await next();
        const responseTime = (Date.now() - start);
        // console.log(`响应时间为: ${responseTime / 1000}s`)
    }
};

module.exports = (app) => {
    app.use(cors());
    app.use(logger())
};