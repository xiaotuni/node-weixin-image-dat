import http from 'http';
import Koa from 'koa';
import ApiHelper from './api/index';
import { Utility } from './Common';

const koa = new Koa();
koa.keys = ['secret'];
koa.use(ApiHelper.init());
koa.use(async (ctx) => {
  Utility.printLog('接口未找到');
  ctx.status = 400;
  ctx.body = { code: 400, msg: 'not found' };
});

koa.context.onerror = function (err) {
  if (!err) {
    return;
  }
  Utility.printLog('------------context on error----------');
  Utility.printLog(this);
  Utility.printLog('项目运行出错了：', err);
  const type = err.constructor.name;
  Utility.printLog('type:', type);
  const bodyInfo = {};
  switch (type) {
    case 'String':
      bodyInfo.code = 400;
      bodyInfo.msg = err;
      break;
    case 'Object':
    case 'Error':
      const { code, status, msg, message } = err;
      bodyInfo.code = status || code || 400;
      bodyInfo.msg = msg || message;
      break;
  }
  Utility.printLog('--------------bodyInfo----BEGIN-------');
  Utility.printLog(bodyInfo);
  Utility.printLog('--------------bodyInfo----END---------');

  this.status = bodyInfo.code;
  this.body = bodyInfo;
  this.res.end(JSON.stringify(bodyInfo));
}

process.on('unhandledRejection', (reason, params) => {
  Utility.printLog('系统出错了：', reason);
  Utility.printLog('系统params：', params);
});

(async () => {
  try {
    Utility.printLog('---启动项目----');
    const { PORT = 1800 } = process.env;
    const server = http.createServer(koa.callback());
    server.listen(PORT);
    Utility.printLog('---监听端口----', `http://127.0.0.1:${PORT}/xtn/api/`);
    process.on('SIGINT', () => {
      server.close(() => {
        setTimeout(() => {
          Utility.printLog('关闭系统');
          process.exit(0);
        }, 200);
      });
    });
  } catch (ex) {
    Utility.printLog(ex);
  }
})();