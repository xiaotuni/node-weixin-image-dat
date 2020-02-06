/**
 * 调用第三个接口的一个类。
 * 
 * @export
 * @class HttpHelper
 */
export default class HttpHelper {

  static async __CallApi(url, method, { params, data: body, form }) {
    const _urlParam = querystring.stringify(params);
    const _url = _urlParam ? `${url}?${_urlParam}` : url;
    const options = {
      json: true, method, headers: {},
    };
    options.headers['Content-Type'] = 'application/json';
    if (body) {
      options.body = body;
    }
    if (form) {
      options.form = form;
    }
    return new Promise((resolve, reject) => {
      requestFn(_url, options, (error, reponse, data) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(data);
      });
    });
  }

  /**
   * get 请求
   * @example
   *  await HttpHelper.onApiGet('http://localhost:3011/cloud_ranch/v2/api/express/', { size: 2, page: 1 })
   * @static
   * @param {any} url 
   * @param {any} params 
   * @returns 
   * @memberof HttpHelper
   */
  static async onApiGet(url, params) {
    return await this.__CallApi(url, 'get', { params });
  }

  /**
   * put 请求
   * @example
   * await HttpHelper.onApiPut('http://localhost:3011/cloud_ranch/v2/api/logistics/test/delete_id_1234', { currentDate: getNowTime() }, { method: 'put', date: new Date(), a: '123', b: 'ccc' });
   * 
   * @static
   * @param {any} url 
   * @param {any} { params, data, form } 
   * @returns 
   * @memberof HttpHelper
   */
  static async onApiPut(url, { params, data, form }) {
    return await this.__CallApi(url, 'put', { params, data, form });
  }

  /**
   * post 请求
   * @example
   * await HttpHelper.onApiPost('http://localhost:3011/cloud_ranch/v2/api/logistics/test', { currentDate: getNowTime(), size: 2, page: 1 }, { date: new Date(), a: '123', b: 'ccc' });
   * 
   * @static
   * @param {any} url 
   * @param {any} { params, data, form } 
   * @returns 
   * @memberof HttpHelper
   */
  static async onApiPost(url, { params, data, form }) {
    return await this.__CallApi(url, 'post', { params, data, form });
  }

  /**
   * delete 请求。
   * 
   * @example
   * await HttpHelper.onApiDelete('http://localhost:3011/cloud_ranch/v2/api/logistics/test/1234124124', { currentDate: getNowTime() });
   * 
   * @static
   * @param {any} url 
   * @param {any} params 
   * @returns 
   * @memberof HttpHelper
   */
  static async onApiDelete(url, params) {
    return await this.__CallApi(url, 'delete', { params });
  }

  /**
   *  将用户头像上传阿里去服务器上去。 保存目录为： process.env.NODE_ENV/portrait/
   *
   * @static
   * @param {*} url
   * @returns
   * {
   *   "type": "jpg",
   *   "format": "JPG",
   *   "mimeType": "image/jpeg",
   *   "width": 132,
   *   "height": 132,
   *   "size": 1742,
   *   "ETag": "\"6D1B7D19D951EBF816D804FB625F4AEF\"",
   *   "ServerSideEncryption": "AES256",
   *   "RequestId": "5B43290324C3978CFE1D97C8",
   *   "key": "development/portrait/23fdfe46-45ed-4041-9644-499dcc42edb0",
   *   "url": "https://upload.yunfarm.net/development/portrait/23fdfe46-45ed-4041-9644-499dcc42edb0",
   *   "cutting": "development/portrait/23fdfe46-45ed-4041-9644-499dcc42edb0@300w_300h_99q",
   *   "name": ""
   * }
   * @memberof HttpHelper
   */
  static async onUploadImgToAliyun(url) {
    // save img 目录
    // /mnt/project/images/
    let __dir = '/mnt';
    if (config.env === 'production') {
      if (!fs.existsSync(__dir)) {
        fs.mkdirSync(__dir);
      }
      __dir += '/projects';
      if (!fs.existsSync(__dir)) {
        fs.mkdirSync(__dir);
      }
      __dir += '/images';
      fs.mkdirSync();
    } else {
      __dir = path.join(__dirname, '../../images');                            // 商户加密公钥
      if (!fs.existsSync(__dir)) {
        fs.mkdirSync(__dir);
      }
    }
    const fileName = Utility.formatDate(new Date().getTime(), 'yyyymmddHHMMss');
    const aa = new Date().getMilliseconds();
    const filePath = path.join(__dir, `${fileName}_${aa}`);
    return await new Promise(async (resolve, reject) => {
      const stream = requestFn(url).pipe(fs.createWriteStream(filePath));
      stream.on('finish', async () => {
        try {
          const data = fs.readFileSync(filePath);
          const info = FileTypeHelper.ImageInfo(data);
          info.size = data.length;
          const result = await AliyunService.PubObjectPortrait(filePath, '', info.mimeType, info.size);
          resolve({ ...info, ...result });
        } catch (ex) {
          reject(ex);
        }
      });
    });
  }
}