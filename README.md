# Download the wallpapers from bing.com.
## first you should open bing.com,then find out the url that used to get the wallpapers info.
### It looks like this:

```js
urls.push("http://cn.bing.com/HPImageArchive.aspx?format=js&idx=" + i + "&n=1&nc=1526806663460&pid=hp");}
```
### the "i" stands for the page number,its range is 0 to 10.

## Some configs in config.js  
### Maximum number of the local wallpaper files saved 
```js
maxFiles: 30
```
### The path of the local wallpaper files saved
```js
wallpapersPath: "H:\\Wallpapers"
```
### The path of file that saves the datas of the downloaded wallpapers (instead of database)
```js
hashsFilePath:"H:\\hashs.txt"
```