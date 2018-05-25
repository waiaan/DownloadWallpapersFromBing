# 从bing.com下载图片，需先打开bing.com，得到对应自己分辨率的图片接口，再填入config.js中的url中

`
urls.push("http://cn.bing.com/HPImageArchive.aspx?format=js&idx=" + i + "&n=1&nc=1526806663460&pid=hp");}
`

# config.js  
### 本地最大壁纸文件数 
    maxFiles: 30,
### 下载的壁纸保存路径
    wallpapersPath: "H:\\Wallpapers",
### 用来保存下载信息、判断过期文件（替代数据库）
    hashsFilePath:"H:\\hashs.txt"