const config = require("./config");
const http = require("http");
const fs = require("fs");
const path = require("path");
const url = require("url");

// config中的路径是否存在
let hashs = fs.existsSync(config.hashsFilePath) ? JSON.parse(fs.readFileSync(config.hashsFilePath)) : {};
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
    let req = http.get(url, (res) => {
      let data = "";
      res.setEncoding('utf8');
      res.on("data", (chunk) => {
        data += chunk;
      })
      res.on("end", () => {
        n++;
        data = JSON.parse(data).images[0];
        // 判断已下载过的图片
        if (hashs[data.hsh]) {
          console.log(getFileName(data.url) + " already exists");
          return false;
        } else {
          hashs[data.hsh] = {};
          hashs[data.hsh].fileName = getFileName(data.url);
          hashs[data.hsh].date = new Date().getTime();
          hashs[data.hsh].copyright = data.copyright;
          imgsData.push(data);
        }
        // 异步循环结束
        if (n === arr.length - 1) {
          handleHashs(hashs);
          getImageData(imgsData);
        }
      })
    });
    req.on("error", (err) => {
      if (err) throw new Error(err);
    })
  });
})();

// 处理得到的图片信息
const getImageData = (data) => {
  // 保存所有图片的数据
  let imgsData = {};
  // 计数器
  let n = 0;
  data.forEach((img, index, images) => {
    let imgUrl = url.resolve(config.host, img.url);
    let fileName = getFileName(img.url)
    let req = http.get(imgUrl, (res) => {
      let data = "";
      res.setEncoding("binary");
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        console.log(fileName + " downloaded");
        n++;
        imgsData[fileName] = data;
        // 异步循环结束
        if (n === images.length - 1) {
          creatImgFile(imgsData);
        }
      });
    });
    req.on("error", (err) => {
      if (err) throw new Error(err);
    })
  })
}

const creatImgFile = (images) => {
  for (let fileName in images) {
    fs.writeFile((path.join(config.wallpapersPath, fileName)), images[fileName], "binary", (err) => {
      if (err) throw new Error(err);
    });
  }
}

const getFileName = (url) => {
  let arr = url.split("/");
  return arr[arr.length - 1];
}

const handleHashs = (hashs) => {
  // 删除超过数量的文件（待实现）
  // let expiredNum = Object.keys(hashs).length - config.maxFiles;
  // if (expiredNum > 0) {
  //   dealExpiredHashs(hashs, expiredNum);
  //   delFiles(hashs);
  // }
  // 
  fs.writeFile(config.hashsFilePath, JSON.stringify(hashs), "utf-8", (err) => {
    if (err) throw new Error(err);
    console.log("hashs has bee written");
  })
}

// 删除超过数量的文件（待实现）
const dealExpiredHashs = (hashs, n) => {
  let curr = null;
  console.log(hashs)
  for (let hash in hashs) {
    console.log(2);
    if (!curr) {
      curr = hashs[hash];
      console.log(3, curr);
    } else if (hashs[hash].date < curr.date) {
      curr = hashs[hash];
      console.log(curr);
    }
  }
}