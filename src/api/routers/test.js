import { Utility } from "../../Common";
import fs from 'fs';
import path from 'path';

const __ReadDirFiles = (pathName) => {
  const result = fs.readdirSync(pathName);
  const data = {
    pathName,
    files: [],
    children: [],
  };
  result.forEach((fileName) => {
    const newPath = path.join(pathName, fileName);
    const stat = fs.statSync(newPath);

    if (stat.isDirectory()) {
      const docList = __ReadDirFiles(newPath);
      data.children.push(docList);
    } else if (stat.isFile()) {
      const { mtime } = stat;
      const ymd_hms = Utility.formatDate(new Date(mtime).getTime(), 'yyyy-mm-dd HH_MM_ss');
      const fileType = fileName.split('.')[1];
      const NewFileName = `${ymd_hms}.${fileType}`;
      data.files.push(Object.assign({ fileName, NewFileName, ymd_hms, fileType }, stat));
    }
  });
  const { files, children } = data;
  if (!Utility.isArray(files)) {
    delete data.files;
  }
  if (!Utility.isArray(children)) {
    delete data.children;
  }
  return data;
};

class ReadDirectoryService {

  static fileTotal = 0;

  /**
   * 根据目录获取文件列表
   *
   * @static
   * @param {*} pathName
   * @returns
   * @memberof ReadDirectoryService
   */
  static getDirectoryFiles(pathName, isDecode) {
    const data = { total: 0, pathName, files: [], children: [], };
    // 判断是否存在
    const isExists = fs.existsSync(pathName);
    if (!isExists) {
      return data;
    }
    const result = fs.readdirSync(pathName);

    result.forEach((fileName) => {
      const newPath = path.join(pathName, fileName);
      const stat = fs.statSync(newPath);
      if (stat.isDirectory()) {
        const info = ReadDirectoryService.getDirectoryFiles(newPath, isDecode);
        data.total += info.total;
        data.children.push(info);
      } else if (stat.isFile()) {
        const { mtime } = stat;
        const ymd_hms = Utility.formatDate(new Date(mtime).getTime(), 'yyyy-mm-dd HH_MM_ss_l');
        const fileType = path.extname(fileName);
        const NewFileName = `${ymd_hms}${fileType}`;
        if (isDecode === true && fileType === '.dat') {
          data.total += 1;
          data.files.push(Object.assign({ fileName, NewFileName, ymd_hms, fileType }, stat));
        } else {
          data.total += 1;
          data.files.push(Object.assign({ fileName, NewFileName, ymd_hms, fileType }, stat));
        }
      }
    });

    const { files, children } = data;
    if (!Utility.isArray(files)) {
      delete data.files;
    }
    if (!Utility.isArray(children)) {
      delete data.children;
    }
    return data;
  }

  /**
   * 解析或转换的文件
   *
   * @static
   * @param {*} { filePath, fileDoctory, newFileName, isDecode, fileType }
   * @returns
   * @memberof ReadDirectoryService
   */
  static parseFile({ filePath, fileDoctory, newFileName, isDecode, fileType }) {
    const bufferList = fs.readFileSync(filePath);
    let newBuffer = [];
    let saveFileName = path.join(fileDoctory, `${newFileName}${fileType}`);
    if (isDecode) {
      const xor1 = this.GetXOR(bufferList);
      if (!xor1) {
        return;
      }
      bufferList.forEach((value) => {
        newBuffer.push(value ^ `0x${xor1.value}`);
      });
      saveFileName = path.join(fileDoctory, `${newFileName}.${xor1.suffix}`);
    } else {
      newBuffer = bufferList;
    }
    fs.writeFileSync(saveFileName, Buffer.from(newBuffer));
    this.fileTotal -= 1;
    Utility.printLog('还余 ', this.fileTotal, '没有处理');
  }

  /**
   * 获取异或的值 
   *
   * @static
   * @param {*} fileBuffer
   * @returns
   * @memberof ReadDirectoryService
   */
  static GetXOR(fileBuffer) {
    const sMapList = Object.keys(this.SuffixMap);
    for (let i = 0; i < sMapList.length; i += 1) {
      const key = sMapList[i];
      const suffix = this.SuffixMap[key];
      const hex = [key.substr(0, 2), key.substr(2, 2), key.substr(4, 2)];
      const xorsMap = {};
      for (let a = 0; a < 3; a += 1) {
        const byte = fileBuffer[a];
        const value = byte ^ `0x${hex[a]}`;
        xorsMap[a] = value;
      }
      if (xorsMap[0] == xorsMap[1] && xorsMap[1] === xorsMap[2]) {
        return { value: (xorsMap[0]).toString(16), suffix };
      }
    }
    return null;
  }

  /**
   * bugger 图片文件的前缀
   *
   * @static
   * @memberof ReadDirectoryService
   */
  static SuffixMap = {
    'ffd8ffe000104a464946': 'jpg',          // JPEG(jpg)
    '89504e470d0a1a0a0000': 'png',          // PNG(png)
    '47494638396126026f01': 'gif',          // GIF(gif)
    '49492a00227105008037': 'tif',          // TIFF(tif)
    '424d228c010000000000': 'bmp',          // 16色位图(bmp)
    '424d8240090000000000': 'bmp',          // 24位位图(bmp)
    '424d8e1b030000000000': 'bmp',          // 256色位图(bmp)
    // '41433130313500000000': 'dwg',          // CAD(dwg)
    // '3c21444f435459504520': 'html',         // HTML(html)
    // '3c21646f637479706520': 'htm',          // HTM(htm)
    // '48544d4c207b0d0a0942': 'css',          // css
    // '696b2e71623d696b2e71': 'js',           // js
    // '7b5c727466315c616e73': 'rtf',          // RichTextFormat(rtf)
    // '38425053000100000000': 'psd',          // Photoshop(psd)
    // '46726f6d3a203d3f6762': 'eml',          // Email[OutlookExpress6](eml)
    // 'd0cf11e0a1b11ae10000': 'doc',          // MSExcel注意：word、msi和excel的文件头一样
    // 'd0cf11e0a1b11ae10000': 'vsd',          // Visio绘图
    // '5374616E64617264204A': 'mdb',          // MSAccess(mdb)
    // '252150532D41646F6265': 'ps',
    // '255044462d312e360d25': 'pdf',          // AdobeAcrobat(pdf)
    // '2e524d46000000120001': 'rmvb',         // rmvb/rm相同
    // '464c5601050000000900': 'flv',          // flv与f4v相同
    // '00000020667479706973': 'mp4',
    // '49443303000000000f76': 'mp3',
    // '000001ba210001000180': 'mpg',          //
    // '3026b2758e66cf11a6d9': 'wmv',          // wmv与asf相同
    // '524946464694c9015741': 'wav',          // Wave(wav)
    // '52494646d07d60074156': 'avi',
    // '4d546864000000060001': 'mid',          // MIDI(mid)
    // '504b0304140000000800': 'zip',
    // '526172211a0700cf9073': 'rar',
    // '235468697320636f6e66': 'ini',
    // '504b03040a0000000000': 'jar',
    // '4d5a9000030000000400': 'exe',          // 可执行文件
    // '3c25402070616765206c': 'jsp',          // jsp文件
    // '4d616e69666573742d56': 'mf',           // MF文件
    // '3c3f786d6c2076657273': 'xml',          // xml文件
    // 'efbbbf2f2a0d0a53514c': 'sql',          // xml文件
    // '7061636b616765207765': 'java',         // java文件
    // '406563686f206f66660d': 'bat',          // bat文件
    // '1f8b0800000000000000': 'gz',           // gz文件
    // '6c6f67346a2e726f6f74': 'properties',   // bat文件
    // 'cafebabe0000002e0041': 'class',        // bat文件
    // '49545346030000006000': 'chm',          // bat文件
    // '04000000010000001300': 'mxp',          // bat文件
    // '504b0304140006000800': 'docx',         // docx文件
    // 'd0cf11e0a1b11ae10000': 'wps',          // WPS文字wps、表格et、演示dps都是一样的
    // '6431303a637265617465': 'torrent',
    // '494d4b48010100000200': '264',
    // '6D6F6F76': 'mov',                      // Quicktime(mov)
    // 'FF575043': 'wpd',                      // WordPerfect(wpd)
    // 'CFAD12FEC5FD746F': 'dbx',              // OutlookExpress(dbx)
    // '2142444E': 'pst',                      // Outlook(pst)
    // 'AC9EBD8F': 'qdf',                      // Quicken(qdf)
    // 'E3828596': 'pwl',                      // WindowsPassword(pwl)
    // '2E7261FD': 'ram',                      // RealAudio(ram)
  }

  static getImageSuffix(fileBuffer) {
    // 将上文提到的 文件标识头 按 字节 整理到数组中
    const imageBufferHeaders = [
      { bufBegin: [0xff, 0xd8], bufEnd: [0xff, 0xd9], suffix: '.jpg' },
      { bufBegin: [0x00, 0x00, 0x02, 0x00, 0x00], suffix: '.tga' },
      { bufBegin: [0x00, 0x00, 0x10, 0x00, 0x00], suffix: '.rle' },
      { bufBegin: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], suffix: '.png' },
      { bufBegin: [0x47, 0x49, 0x46, 0x38, 0x39, 0x61], suffix: '.gif' },
      { bufBegin: [0x47, 0x49, 0x46, 0x38, 0x37, 0x61], suffix: '.gif' },
      { bufBegin: [0x42, 0x4d], suffix: '.bmp' },
      { bufBegin: [0x0a], suffix: '.pcx' },
      { bufBegin: [0x49, 0x49], suffix: '.tif' },
      { bufBegin: [0x4d, 0x4d], suffix: '.tif' },
      { bufBegin: [0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x20, 0x20], suffix: '.ico' },
      { bufBegin: [0x00, 0x00, 0x02, 0x00, 0x01, 0x00, 0x20, 0x20], suffix: '.cur' },
      { bufBegin: [0x46, 0x4f, 0x52, 0x4d], suffix: '.iff' },
      { bufBegin: [0x52, 0x49, 0x46, 0x46], suffix: '.ani' }
    ]
    for (const imageBufferHeader of imageBufferHeaders) {
      let isEqual
      // 判断标识头前缀
      if (imageBufferHeader.bufBegin) {
        const buf = Buffer.from(imageBufferHeader.bufBegin)
        isEqual = buf.equals(
          //使用 buffer.slice 方法 对 buffer 以字节为单位切割
          fileBuffer.slice(0, imageBufferHeader.bufBegin.length)
        )
      }
      // 判断标识头后缀
      if (isEqual && imageBufferHeader.bufEnd) {
        const buf = Buffer.from(imageBufferHeader.bufEnd)
        isEqual = buf.equals(fileBuffer.slice(-imageBufferHeader.bufEnd.length))
      }
      if (isEqual) {
        return imageBufferHeader.suffix
      }
    }
    // 未能识别到该文件类型
    return ''
  }

  /**
   * 解析微信
   *
   * @static
   * @param {*} info
   * @param {boolean} [isDecode=false]
   * @memberof ReadDirectoryService
   */
  static ParseWX(info, isDecode = false) {
    const { pathName, files = [], children = [] } = info;

    files.forEach((item) => {
      const { fileName, ymd_hms: newFileName, fileType } = item;
      const filePath = path.join(pathName, fileName);
      try {
        this.parseFile({ filePath, fileDoctory: pathName, newFileName, fileType, isDecode });
      } catch (ex) {
        console.log(ex);
      }
    });

    children.forEach((child) => {
      this.ParseWX(child, isDecode);
    })
  }
}

export default (router) => {
  router
    .get('/test/', async (ctx) => {
      try {
        const { filePath, isDecode } = ctx.query;
        if (!filePath) {
          Utility.throwClientError({ msg: '文件路径不存在' });
        }
        const info = ReadDirectoryService.getDirectoryFiles(filePath, isDecode);
        ReadDirectoryService.fileTotal = info.total;
        Utility.printLog('--------------共有-----------', info.total, '个文件要进行处理');
        ReadDirectoryService.ParseWX(info, isDecode == 1 ? true : false);
        ctx.body = info;
      } catch (ex) {
        Utility.throwClientError({ msg: ex.message });
      }
    })
};