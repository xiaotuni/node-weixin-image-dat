import dateformat from 'dateformat';
import { HttpHelper } from '.';

class ServerError extends Error {
  constructor(message, status = 500) {
    super(message);
    this.status = status;
  }
  push(error) {
    if (!this.errors) {
      this.errors = [];
    }
    this.errors.push(error);
  }
}

/**
 * 一些通用的方法类。
 * 
 * @export
 * @class Utility
 */
export default class Utility {

  static async initWalletAccount(uid, type) {
    const data = {};
    data.account = { uid, type };
    await HttpHelper.onApiPost(config.initWalletUrl, { data });
  }

  /**
   * 密码加密
   * 
   * @static
   * @param {any} password 
   * @returns 
   * @memberof Utility
   */
  static PasswordEncryption(password) {
    const salt = randomstring.generate(24);
    return sha256(password + salt);
  }

  /**
   * 格式化日期
   * yyyymmddHHMMss
   * @static
   * @param {any} value  
   * @param {string} [format='yyyy-mm-dd HH:MM:ss'] 
   * @returns 
   * @memberof Utility
   */
  static formatDate(value, format = 'yyyy-mm-dd HH:MM:ss') {
    if (!Utility.isTimestamp(value)) {
      return value;
    }
    return dateformat(new Date(value), format);
  }

  /**
   * 隐藏指定区间内字段为*
   *
   * @static
   * @param {*} value
   * @param {*} begin
   * @param {*} end
   * @returns
   * @memberof Utility
   */
  static hideStr(value, begin, end) {
    if (!value) {
      return;
    }
    if (value.constructor.name !== 'String' || value.length < begin) {
      return value;
    }
    const _size = value.length;
    let newValue = value.substring(0, begin);
    const endIndex = end < _size ? end : _size;
    for (let i = begin; i < endIndex; i += 1) {
      newValue += '*';
    }
    const lastValue = _size - end > 0 ? value.substring(end) : '';
    return `${newValue}${lastValue}`;
  }

  /**
   * 身份证验证
   * 
   * @static
   * @param {any} code 
   * @returns 
   * @memberof Utility
   */
  static idCodeValid(code) {
    // 身份证号合法性验证  
    // 支持15位和18位身份证号  
    // 支持地址编码、出生日期、校验位验证  
    const city = {
      11: '北京', 12: '天津', 13: '河北', 14: '山西', 15: '内蒙古', 21: '辽宁', 22: '吉林', 23: '黑龙江', 31: '上海', 32: '江苏',
      33: '浙江', 34: '安徽', 35: '福建', 36: '江西', 37: '山东', 41: '河南', 42: '湖北', 43: '湖南', 44: '广东', 45: '广西', 46: '海南',
      50: '重庆', 51: '四川', 52: '贵州', 53: '云南', 54: '西藏', 61: '陕西', 62: '甘肃', 63: '青海', 64: '宁夏', 65: '新疆', 71: '台湾',
      81: '香港', 82: '澳门', 91: '国外',
    };
    let row = { pass: true, msg: '验证成功' };
    if (!code || !/^\d{6}(18|19|20)?\d{2}(0[1-9]|1[012])(0[1-9]|[12]\d|3[01])\d{3}(\d|[xX])$/.test(code)) {
      row = { pass: false, msg: '身份证号格式错误' };
    } else if (!city[code.substr(0, 2)]) {
      row = { pass: false, msg: '身份证号地址编码错误' };
    } else if (code.length === 18) { // 18位身份证需要验证最后一位校验位  
      code = code.split('');
      // ∑(ai×Wi)(mod 11)  
      // 加权因子  
      const factor = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
      // 校验位  
      const parity = [1, 0, 'X', 9, 8, 7, 6, 5, 4, 3, 2];
      let sum = 0;
      let ai = 0;
      let wi = 0;
      for (let i = 0; i < 17; i++) {
        ai = code[i];
        wi = factor[i];
        sum += ai * wi;
      }
      if (parity[sum % 11] !== code[17].toUpperCase()) {
        row = { pass: false, msg: '身份证号校验位错误' };
      }
    }
    return row;
  }

  /**
   * 解析身份证
   *
   * @static
   * @param {*} code 身份证号
   * @param {*} type 1:出生日期；2:性别;3：年龄
   * @returns
   * @memberof Utility
   */
  static parseIdCard(code, type = 1) {
    // 判断是不是身份证。
    if (!this.idCodeValid(code)) {
      return null;
    }
    const _y = code.substring(6, 10);
    const _m = code.substring(10, 12);
    const _d = code.substring(12, 14);
    const birth = `${_y}-${_m}-${_d}`;
    if (type === 1) {                   // 出生日期
      return birth;
    } else if (type === 2) {           // 性别
      const result = parseInt(code.substr(16, 1), 0) % 2 === 1 ? '男' : '女';
      return result;
    } else if (type === 3) {           // 年龄
      const now = new Date();
      const birth_time = new Date(birth).getTime();
      const diffTime = now - birth_time;
      const age = Math.ceil(diffTime / (60 * 60 * 1000 * 24 * 365)) - 1;
      return age;
    }
    return null;
  }

  /**
   *是否是布尔值
   *
   * @static
   * @param {*} value
   * @returns
   * @memberof Utility
   */
  static isBoolean(value) {
    return typeof value === 'boolean';
  }

  /**
   * 整形数 2 = true; '2' = false
   * 
   * @static
   * @param {any} value 
   * @returns 
   * @memberof Utility
   */
  static isInt(value) {
    if (Utility.isIntNumber(value)) {
      return typeof value === 'number';
    }
    return false;
  }

  /**
   * 整形数字: 2=true; '2'=true
   * 
   * @static
   * @param {any} value 
   * @returns 
   * @memberof Utility
   */
  static isIntNumber(value) {
    if (value === '0' || value === 0) {
      return true;
    }
    const re = /^[1-9]+[0-9]*]*$/;
    return re.test(value);
  }

  /**
   * 判断是否是数字, 如：'123.1' 、123.1 都是true
   * 
   * @static
   * @param {any} value 
   * @returns 
   * @memberof Utility
   */
  static isNumber(value) {
    const re = /^[0-9]+\.?[0-9]*$/;// ;
    return re.test(value);
  }

  /**
   * 是不是浮点型, 如：'123.1' = false 、123.1 = true
   * 
   * @static
   * @param {any} value 
   * @returns 
   * @memberof Utility
   */
  static isFloat(value) {
    const result = Utility.isNumber(value);
    return result && parseFloat(value) === value;
  }

  /**
   * 时间戳判断
   * 
   * @static
   * @param {any} value 
   * @returns 
   * @memberof Utility
   */
  static isTimestamp(value) {
    if (typeof value !== 'number') {
      return false;
    }
    return true;
  }

  /**
   * 时间戳判断
   * 
   * @static
   * @param {any} value 
   * @returns 
   * @memberof Utility
   */
  static isTimestampByString(value) {
    if (!value) {
      return false;
    }
    if (Utility.isIntNumber(value)) {
      try {
        const date = new Date(Number(value));
        if (date.getTime() > 1127233947467) {
          return true;
        }
        return false;
      } catch (ex) {
        return false;
      }
    } else {
      return false;
    }
  }

  /**
   * 验证手机号
   * 
   * @static
   * @param {any} value 
   * @returns 
   * @memberof Utility
   */
  static isPhone(value) {
    const reg = /^0?(1[34578])[0-9]{9}$/;
    return reg.test(value);
  }

  /**
   * Url验证
   * 
   * @static
   * @param {any} value 
   * @returns 
   * @memberof Utility
   */
  static isUrl(value) {
    const strRegex = /(http|ftp|https):\/\/[\w\-_]+(\.[\w\-_]+)+([\w\-\.,@?^=%&:/~\+#]*[\w\-\@?^=%&/~\+#])?/;
    return strRegex.test(value);
  }

  /**
   * 是否大写字母
   * 
   * @static
   * @param {any} value 
   * @returns 
   * @memberof Utility
   */
  static isCapital(value) {
    const reg = /[A-Z]/;
    return reg.test(value);
  }

  /**
   * 是否为空
   *
   * @static
   * @param {any} value
   * @returns
   * @memberof Utility
   */
  static isEmpty(value) {
    if (value === 0) {
      return true;
    }
    if (value) {
      return true;
    }
    return false;
  }

  /**
   * 是否是一个对象
   * 
   * @static
   * @param {any} value 要判断的对象
   * @returns 
   * @memberof Utility
   */
  static isObject(value) {
    const keys = Object.keys(value);
    const values = Object.values(value);
    console.log('is object typeof value is:', typeof value);
    return keys.length > 0 && values.length > 0 && typeof value === 'object';
  }

  /**
   * 是否为空
   *
   * @static
   * @param {any} value
   * @returns
   * @memberof Utility
   */
  static isNotEmpty(value) {
    return !this.isEmpty(value);
  }

  /**
   * 手机号验证
   *
   * @static
   * @param {*} value
   * @returns
   * @memberof Utility
   */
  static isMobilePhone(value) {
    const reg = /^(\+?0?86\-?)?1[3456789]\d{9}$/;
    return reg.test(value);
  }

  /**
   * 电子邮件验证
   *
   * @static
   * @param {*} value
   * @returns
   * @memberof Utility
   */
  static isEmail(value) {
    const reg = /^\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/;
    return reg.test(value);
  }

  /**
   * 是否是monogoDB里的ObjectID值
   * 
   * @static
   * @param {any} value 
   * @returns 
   * @memberof Utility
   */
  static isMongoDBObjectId(value) {
    return objectid.isValid(value);
  }

  /**
   * 传入的是不是日期字符串
   *  2018-08-08 2018/08/08 没有问题。
   *  20180808 20181140 这种会报错。
   *
   * @static
   * @param {*} value
   * @returns
   * @memberof Utility
   */
  static isDateByString(value) {
    try {
      const a = new Date(value);
      if (a) {
        Utility.printLog('--->', a);
        const year = a.getFullYear();
        Utility.printLog('--->', year);
        console.log(year);
        return year > 0 ? true : false;
      }
      return false;
    }
    catch (ex) {
      return false;
    }
  }

  static getMongoDbId() {
    return objectid().toString();
  }

  /**
   * 此方法特殊方法。obj只能传一个对象。
   * 
   * @static
   * @param {any} obj 对象
   * @param {any} value 值
   * @memberof Utility
   */
  static isObjectValue = obj => (value) => {
    if (!Utility.isObject(obj)) {
      return false;
    }

    return Object.values(obj).includes(value);
  }

  /**
   * 去空格
   * @param value
   * @returns {*}
   */
  static trim(value) {
    if (typeof value === 'number') {
      return value;
    } else if (typeof value !== 'undefined' && typeof value === 'string') {
      return value.replace(/(^\s*)|(\s*$)/g, '');
    } else if (typeof value === 'object') {
      return value;
    } else if (typeof value === 'boolean') {
      return value;
    }
    return value;
  }

  /**
   * 去右边空格
   * @param value
   * @returns {*}
   */
  static trimRight(value) {
    if (typeof value !== 'undefined') {
      return value.replace(/(\s*$)/g, '');
    }
    return '';
  }

  /**
   * 去左边空格
   * @param s
   * @returns {*}
   */
  static trimLeft(value) {
    if (typeof value !== 'undefined') {
      return value.replace(/(^\s*)/g, '');
    }
    return '';
  }

  /**
   * 抛出异常信息
   * 
   * @static
   * @param {any} { msg, status = 500 } 
   * @memberof Utility
   */
  static throwServerError({ msg, status = 500 }) {
    throw new ServerError(msg, status);
  }
  /**
   * 抛出异常信息
   * 
   * @static
   * @param {any} { msg, status = 400 } 
   * @memberof Utility
   */
  static throwClientError({ msg, status = 400 }) {
    throw new ServerError(msg, status);
  }


  /**
   * 打印输出日志
   * @method __PrintLog
   * @param {object} args 内容
   * @private
   */
  static printLog(args) {
    try {
      const _curDate = new Date();
      const _aa = `${_curDate.toLocaleDateString()} ${_curDate.toLocaleTimeString()}.${_curDate.getMilliseconds()}`;
      console.log(`${_aa}-->`, ...arguments);
      // console.log(args);
    } catch (ex) {
      console.log('---------输出日志，传入的内容传为JSON出现在异常--------------');
      console.log(ex);
      console.log('---------输出日志，内容为下--------------');
      console.log(args);
    }
  }

  /**
   * 向请求接口返回 错误信息。
   * 
   * @static
   * @param {any} ctx 
   * @param {any} ex 
   * @memberof Utility
   */
  static clientErrorInfo(ctx, error) {
    // console.log(new Date(), error);
    const { status } = error;
    ctx.status = 400;
    let errmsg = error.toString().replace('Error: ', '');
    Utility.printLog(error);
    ctx.body = { errcode: status, errmsg };
  }

  /**
   * 判断是否是数据，行数必须大1
   * 
   * @static
   * @param {any} list 
   * @returns 
   * @memberof Utility
   */
  static isArray(list) {
    return Array.isArray(list) && list.length > 0;
  }

  /**
   * 转为数字浮点类型
   * 
   * @static
   * @param {any} num 
   * @param {any} e 
   * @returns 
   * @memberof Utility
   */
  static FixNum(num, e) {
    if (_.isNumber(num)) {
      return parseFloat(num.toFixed(e));
    } else {
      return NaN;
    }
  }

  /**
   * 克隆
   * 
   * @static
   * @param {any} obj 
   * @returns 
   * @memberof Utility
   */
  static clone(obj) {
    return obj ? JSON.parse(JSON.stringify(obj)) : obj;
  }

  /**
   * 生成订单编号
   * 
   * @static
   * @memberof Utility
   */
  static generateOrderCode(numLength) {
    const time = Utility.formatDate(getNowTime(), 'yyyymmddHHMMss');
    const randNumber = generateRandom(numLength || 3, Collection_Num);
    return `${time}${randNumber}`;
  }

  /**
   * 生成序号
   * 
   * @static
   * @returns 
   * @memberof Utility
   */
  static generateSerNum() {
    const time = Utility.formatDate(getNowTime(), 'yyyymmddHHMMss');
    const randomNum = randomstring.generate({ length: 12, charset: 'numeric' });
    return `${time}2${randomNum}`;
  }

  static generateUuid() {
    const randomID = Math.random().toString() +
      Math.random().toString() +
      Math.random().toString();
    console.log('randomID:', randomID);
    return randomID;
  }

  /**
   * 获取收益组合类型
   * @param array
   * @returns {string}
   */
  static getType(arr) {
    const newArr = [];
    arr.forEach((index) => {
      if (index) {
        newArr.push('1');
      } else {
        newArr.push('0');
      }
    });
    return newArr.join('');
  }

  /**
   * 判断target是否在range内
   * @param target
   * @param range
   * @returns {boolean}
   */
  static isInRange(target, range) {
    if (range[0] <= target && target <= range[1]) {
      return true;
    } else {
      return false;
    }
  }

  /**
   *
   * @param target
   * @param array
   * @returns {boolean}
   */
  static isInArray(target, array) {
    for (let i = 0; i < array.length; i++) {
      if (target === array[i]) {
        return true;
      }
    }
    return false;
  }

  /**
   * 返回字符串的hashcode
   * @param  {[type]} str [description]
   * @return {[type]}     [description]
   */
  static hashCode(str) {
    let ret = 0;
    for (let i = 0, len = str.length; i < len; i++) {
      ret = (31 * ret + str.charCodeAt(i)) << 0;
    }
    return ret;
  }

  /**
   * 获取应插入的队列名称
   * @param batch_id
   * @param runningBatch
   * @returns {string}
   */
  static genQueueName(batch_id, runningBatch) {
    let queueName = '';
    // console.log(runningBatch);
    runningBatch.forEach((item, index) => {
      if (batch_id == item) {
        queueName = `task_queue_${index}`;
      } else {
        return false;
      }
    });

    if (queueName === '') {
      queueName = 'task_queue_default';
    }
    return queueName;
  }
}
