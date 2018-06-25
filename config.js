let urls = [];
for (let i = 10; i > -1; i--) {
  urls.push("http://cn.bing.com/HPImageArchive.aspx?format=js&idx=" + i + "&n=1&nc=1526806663460&pid=hp");
}
const config = {
  host: "http://cn.bing.com/",
  urls: urls,
  maxFiles: 30,
  wallpapersPath: "C:\\Users\\zju\\Desktop\\test\\Wallpapers",
  hashsFilePath: "C:\\Users\\zju\\Desktop\\test\\hashs.txt"
  // wallpapersPath: "H:\\softwares\\Wallpapers",
  // hashsFilePath: "H:\\softwares\\hashs.txt"
}
module.exports = config;