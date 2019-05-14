// 遍历urls，获取image链接，读取image并保存到本地，判断image文件夹中的数量是否超过，是的话删除
const { urls, maxFiles, wallpapersPath, host } = require('./config');
const https = require('https');
const fs = require('fs');
const path = require('path');

const requestImageUrl = (url, encode) => {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      encode && res.setEncoding(encode);
      res.on('data', (chunk) => {
        data += chunk;
      }).on('error', (e) => {
        reject(e);
      }).on('end', () => {
        resolve(data);
      });
    })
  })
}

const readDir = (path) => {
  return new Promise((resolve, reject) => {
    fs.readdir(path, (err, res) => {
      if (err) return reject(err);
      resolve(res);
    })
  });
}

const createFile = (path, data) => {
  return new Promise((resolve, reject) => {
    fs.writeFile(path, data, "binary", (err) => {
      if (err) return reject(err);
      let fileNameArr = path.split('\\');
      let fileName = fileNameArr[fileNameArr.length - 1];
      resolve(fileName + ' has been saved!');
    });
  });
}

const getFileStat = (path) => {
  return new Promise((resolve, reject) => {
    fs.stat(path, (err, stat) => {
      if (err) return reject(err);
      resolve(stat);
    });
  });
}

const getCertainMin = (arr, n) => {
  let tmpArr = [];
  for (let j = 1; j <= n; j++) {
    let min = 0;
    for (let i = 1, len = arr.length; i < len; i++) {
      if (arr[i] < arr[min]) {
        min = i;
      }
    }
    arr.splice(min, 1, Number.POSITIVE_INFINITY);
    tmpArr.push(min);
  }
  return tmpArr;
}

class DownloadWallpapersFromBing {
  constructor() {
    this.host = host;
    this.maxFilesCount = 0;
    this.wallpapersPath = '';
    this.existFilesCount = 0;
    this.existFiles = {};
  }

  async getExistFiles() {
    const dirContent = await readDir(wallpapersPath);
    return dirContent;
  }

  async generateExistFilesInfo() {
    const dirContent = await this.getExistFiles();
    for (let i = 0, len = dirContent.length; i < len; i++) {
      this.existFiles[dirContent[i]] = true;
    }
    this.existFilesCount = dirContent.length;
  }

  async generateImageFile(info) {
    let fileName = (info.copyright.split('(')[0].trim() + '.jpg').replace('/', '&&');
    if (this.existFiles[fileName]) {
      console.log(fileName + ' exists');
      return;
    }
    let image = await requestImageUrl(this.host + info.url.slice(0), "binary");
    let imagePath = path.join(this.wallpapersPath, fileName);
    let writeRes = await createFile(imagePath, image);
    console.log(writeRes);
    this.existFiles[fileName] = true;
    this.existFilesCount++;
  }

  async getImageUrls(urls) {
    for (let i = 0, len = urls.length; i < len; i++) {
      let res = null;
      try {
        res = await requestImageUrl(urls[i]);
      } catch (error) {
        throw new Error(error);
      }
      res = typeof res === 'string' && JSON.parse(res);
      await this.generateImageFile(res.images[0]);
    }
  }

  async delExpiredFiles(delFileCount) {
    let fileCtimes = [], files = [];
    for (let fileName in this.existFiles) {
      let fileStat = await getFileStat(path.join(this.wallpapersPath, fileName));
      fileCtimes.push(fileStat.ctimeMs);
      files.push(fileName);
    }
    const minFileIdxs = getCertainMin(fileCtimes, delFileCount);
    for (let i = 0, len = minFileIdxs.length; i < len; i++) {
      let fileName = files[minFileIdxs[i]];
      let filePath = path.join(wallpapersPath, fileName);
      fs.unlink(filePath, (err) => {
        if (err) throw err;
        console.log(fileName + ' was deleted');
      })
    }
  }

  async init(opt) {
    const { urls, maxFiles, wallpapersPath, host } = opt;
    this.maxFilesCount = maxFiles;
    this.wallpapersPath = wallpapersPath;
    this.host = host;
    await this.generateExistFilesInfo();
    await this.getImageUrls(urls);
    let delFileCount = this.existFilesCount - this.maxFilesCount;
    if (delFileCount > 0) {
      this.delExpiredFiles(delFileCount);
    }
  }
}

new DownloadWallpapersFromBing().init({
  urls, maxFiles, wallpapersPath, host
})
