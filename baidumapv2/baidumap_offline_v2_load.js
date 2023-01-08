/*百度地图离线API V2 接口文件
 *发布: http://www.xiaoguo123.com/p/baidumap_offline_v2
 *网页中只需要加载此JS文件即可
 *@2016-8-22
 *百度地图图片即瓦片文件请自行下载，或联系我索取(QQ 63659875 验证：百度地图API)
 */
var bdmapcfg = {
  'imgext':'.png', //瓦片图的后缀 ------ 根据需要修改，一般是 .png .jpg
  'tiles_dir':''   //瓦片图的目录，为空默认在 baidumap_v2/tiles/ 目录
};

//////////////////下面的保持不动///////////////////////////////////
var scripts = document.getElementsByTagName("script");
var JS__FILE__ = scripts[scripts.length - 1].getAttribute("src");
bdmapcfg.home = JS__FILE__.substr(0, JS__FILE__.lastIndexOf("/")+1); //地图API主目录, images,tiles都在此目录下
(function(){
  window.BMap_loadScriptTime = (new Date).getTime();
  //加载地图API主文件
  document.write('<script type="text/javascript" src="'+bdmapcfg.home+'baidumap_offline_v2_20160822.js"></script>');
})();