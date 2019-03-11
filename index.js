process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
const config = require("./config");
const https = require("https");
const fs = require("fs");
const path = require("path");
const url = require("url");
let hashs = {};
// config中的路径是否存在
if (fs.existsSync(config.hashsFilePath)) {
  // 在txt文件开始位置莫名其妙出现特殊符号
  let str = fs.readFileSync(config.hashsFilePath).toString();
  // str = str.substr(1, str.length);
  hashs = JSON.parse(str);
}

if (!fs.existsSync(config.wallpapersPath)) {
  fs.mkdirSync(config.wallpapersPath);
}

// 获取所有链接的图片信息
(() => {
  // 保存所有链接的json数据
  let imgsData = [];
  // 计数器
  let n = 0;
  config.urls.forEach((url, index, arr) => {
    let req = https.get(url, (res) => {
      let data = "";
      res.setEncoding('utf8');
      res.on("data", (chunk) => {
        data += chunk;
      })
      res.on("end", () => {
        n++;
        data = JSON.parse(data).images[0];
        // 判断已下载过的图片
        if (data.hsh && hashs[data.hsh]) {
          console.error(data.copyright + "\nalready exists");
        } else {
          hashs[data.hsh] = {};
          imgsData.push(data);
        }
        // 异步循环结束
        if (n === arr.length) {
          getImageData(imgsData, hashs);
        }
      })
    });
    req.on("error", (err) => {
      if (err) throw new Error(err);
    })
  });
})();

// 处理得到的图片信息
const getImageData = (data, hashs) => {
  // 保存所有图片的数据
  let imgsData = {};
  // 计数器
  let n = 0;
  data.forEach((img, index, images) => {
    // console.log(img);
    let imgUrl = url.resolve(config.host, img.url);
    let fileName = getFileName(img.urlbase);
    let req = https.get(imgUrl, (res) => {
      let data = "";
      res.setEncoding("binary");
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        console.log(img.copyright + "\ndownloaded");
        n++;
        imgsData[fileName] = data;
        if (!hashs[img.hsh]) {
          throw new Error("Did not get the image " + fileName);
        } else {
          hashs[img.hsh].fileName = getFileName(img.url);
          hashs[img.hsh].date = new Date().getTime();
          hashs[img.hsh].copyright = img.copyright;
        }
        // 异步循环结束
        if (n === images.length) {
          creatImgFile(imgsData,hashs);
        }
      });
    });
    req.on("error", (err) => {
      if (err) throw new Error(err);
    })
  })
}

const creatImgFile = (images,hashs) => {
  for (let fileName in images) {
    fs.writeFileSync((path.join(config.wallpapersPath, fileName)), images[fileName], "binary");
  }
  handleHashs(hashs);
}

const getFileName = (url) => {
  let arr = url.split("=");
  return arr[arr.length - 1].replace('OHR.','')+'.jpg';
}

// 删除hashs中并不存在文件的值（待实现）
const delNotExistsValue = (hashs) => {
  const files = fs.readdirSync(config.wallpapersPath);
  // console.log(files.length);
  outer:for (let k in hashs){
    let fileName = hashs[k].fileName;
    for (let i = 0, leni = files.length; i < leni;i++){
      if (files[i]===fileName) {
        continue outer;
      }
    }
    console.log(fileName + " not exsits");
    delete hashs[k];
  }
  return hashs;
}

// 删除超过数量的文件
const dealExpiredHashs = (hashs, n) => {
  let times = [], expiredTime = [];
  for (let key in hashs) {
    times.push(hashs[key].date);
  }
  times.sort();
  // console.log(times);
  for (let i = 0; i < n; i++) {
    expiredTime.push(times.shift());
  }
  // console.log(expiredTime);
  for (let key in hashs) {
    for (let i = 0, leni = expiredTime.length; i < leni; i++) {
      if (hashs[key].date === expiredTime[i]) {
        // console.log(hashs[key]);
        const fileToBeDeledPath = path.join(config.wallpapersPath, hashs[key].fileName);
        // console.log(fileToBeDeledPath);
        if (fs.existsSync(fileToBeDeledPath)) {
          // fs.unlink(fileToBeDeledPath, (err) => {
          //   if (err) throw new Error(err);
          // });
          fs.unlinkSync(fileToBeDeledPath);
          console.log(hashs[key].copyright + "\nhas been deleted");
        }
        delete hashs[key];
        break;
      }
    }
  }
  // hashs文件中有重复的文件名但不同hash的值（待实现）
  hashs = delNotExistsValue(hashs);
  return hashs;
}

const handleHashs = (hashs) => {
  // 判断过期的文件数
  // console.log(Object.keys(hashs));
  // const fileNums = fs.readdirSync(config.wallpapersPath).length;
  // console.log(fileNums);
  let expiredNum = fs.readdirSync(config.wallpapersPath).length - config.maxFiles;
  // console.log(expiredNum);
  if (expiredNum > 0) {
    hashs=dealExpiredHashs(hashs, expiredNum);
  }
  // console.log(hashs);
  fs.writeFile(config.hashsFilePath, JSON.stringify(hashs), "utf-8", (err) => {
    if (err) throw new Error(err);
    console.log("hashs has bee written");
  })
}

// 测试用
// handleHashs(hashs);
