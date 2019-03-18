const {urls,maxFiles,wallpapersPath,host} = require('./config');
const https = require('https');
const fs = require('fs');
const path = require('path');

const requestImageUrl = (url,encode) => {
  return new Promise((resolve,reject) => {
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
  return new Promise((resolve,reject) => {
    fs.readdir(path, (err,res) => {
      if (err) return reject(err);
      resolve(res);
    })
  });
}

const createFile = (path,data) => {
  return new Promise((resolve,reject) => {
    fs.writeFile(path, data, "binary", (err) => {
      if (err) return reject(err);
      let fileNameArr = path.split('\\');
      let fileName = fileNameArr[fileNameArr.length - 1];
      resolve(fileName+' has been saved!');
    });
  });
}

const getFileStat = (path) => {
  return new Promise((resolve, reject) => {
    fs.stat(path, (err,stat) => {
      if (err) return reject(err);
      resolve(stat);
    });
  });
}

const getCertainMin = (arr,n) => {
  let tmpArr = [];
  for (let j = 1; j <= n;j++){
    let min = 0;
    for (let i = 1, len = arr.length; i < len; i++) {
      if (arr[i] < arr[min]) {
        min = i;
      }
    }
    tmpArr=tmpArr.concat(arr.splice(min, 1));
  }
  return tmpArr;
}

(async () => {
  let dirContent = await readDir(wallpapersPath);
  let fileNums = dirContent.length;
  let existFiles = {};
  for (let i = 0; i < fileNums;i++){
    existFiles[dirContent[i]] = true;
  }
  for (let i = 0, len = urls.length; i < len;i++){
    let imageData = await requestImageUrl(urls[i]);
    typeof imageData === 'string' && (imageData = JSON.parse(imageData).images[0]);
    let fileName = imageData.copyright.split('(')[0].trim() + '.jpg';
    if (existFiles[fileName]) {
      console.log(fileName + ' exists');
      continue;
    }
    let image = await requestImageUrl(host + imageData.url.slice(0), "binary");
    let imagePath = path.join(wallpapersPath, fileName );
    let writeRes = await createFile(imagePath, image);
    console.log(writeRes);
    fileNums++;
  }
  const delFileCount = fileNums - maxFiles;
  if (delFileCount>0) {
    let fileCtimes = [];
    for (let i = 0, len = dirContent.length; i < len; i++) {
      let fileStat = await getFileStat(path.join(wallpapersPath, dirContent[i]));
      fileCtimes.push(fileStat.ctimeMs);
    }
    const minFileIdxs = getCertainMin(fileCtimes, dirContent.length - delFileCount);
    for (let i = 0, len = minFileIdxs.length; i < len;i++){
      let fileName = dirContent[minFileIdxs[i]];
      let filePath = path.join(wallpapersPath, fileName);
      fs.unlink(filePath, () => {
        if (err) throw err;
        console.log(fileName+' was deleted');
      })
    }
  }
})();
