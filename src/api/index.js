import compose from 'koa-compose';
import Router from 'koa-router';
import importDir from 'import-dir';
import { Utility } from '../Common';

export default new class ApiHelper {

  init() {
    Utility.printLog('初始化项目路由...')
    const router = new Router({ prefix: '/xtn/api' });
    const routerMap = importDir('./routers');
    Object.keys(routerMap).forEach((key) => {
      routerMap[key](router);
    });

    return compose([
      router.routes(),
      router.allowedMethods()
    ]);
  }
} 