/**
 * 百度地图瓦片图地址解析接口
 * 输入一个矩形区域Bounds和缩放级别，获得此矩形内瓦片个数，瓦片地址
 * 主入口类是BoundsTiles
 * 基于Baidu Map API 2.0 or 3.0
 * @autho: www.xiaoguo123.com
 * @version: 1.0 beta
 * 获得离线地图API使用方法请参见网站www.xiaoguo123.com
 */

/** 
 * @namespace BMap的所有library类均放在BMapLib命名空间下
 */
var BMapLib = window.BMapLib = BMapLib || {};

(function(){
	
	//百度地图对象
	var _map = null;
	
	/** 
     * 主入口类
	 * 例如: var boundsTiles = new BMapLib.BoundsTiles(map);
     */
    var BoundsTiles = BMapLib.BoundsTiles = function(map){
		if (!map) {
			return;
		}
		this._map = map;
	}
	
	/**
	 * 输入一个矩形区域Bounds和缩放级别，获得此矩形内瓦片个数
	 */
	BoundsTiles.prototype.getTilesCount = function(bounds, zoom){
		var t = _getTilesInfo(bounds, zoom);
		return t.count;
	}
	
	/**
	 * 输入一个矩形区域Bounds和缩放级别，获得此矩形内瓦片数，瓦片行列范围
	 * 返回对象： {zoom: 8, count: 24, xMin: 1579, xMax: 1584, yMin: 587, yMax: 590}
	 */
	BoundsTiles.prototype.getTilesInfo = function(bounds, zoom){
		return _getTilesInfo(bounds, zoom);
	}
	
	/**
	 * 根据getTilesInfo取的瓦片地址
	 * 回调函数参数(path, url)
	 * path = zoom/x/y.png
	 * url = http://online1.map.bdimg.com/tile/?qt=vtile&x=197&y=74&z=10&styles=pl&scaler=1&udt=20190712
	 */
	BoundsTiles.prototype.getTiles = function(tilesInfo, callback){
		var t = tilesInfo;
		for(var i=t.xMin; i<=t.xMax; i++){
			for(var j=t.yMin; j<=t.yMax; j++){
				var url = this.getTilesUrl(i, j, t.zoom);
				var path = t.zoom+"/"+i+"/"+j+".png";
				if(!!callback){
					callback(path, url);
				}
			}
		}
	}
	
	/**
	 * 瓦片地址URL
	 */
	BoundsTiles.prototype.getTilesUrl = function(x, y, zoom){
		//这个地方能直接获取瓦片地址的内部方法，挺好，省去了很多的代码移植。
		var getTilesUrl = this._map.getMapType().getTileLayer().getTilesUrl;
		return getTilesUrl({x:x,y:y}, zoom, "normal");
	}
	
		/**
	 * 返回瓦片个数，x，y范围
	 */
	function _getTilesInfo(bounds, zoom) {
		if( !bounds || !zoom || zoom < 1 || zoom > 19 ){
			return null;
		}
		
		var leftBottom = bounds.getSouthWest();
		var rightTop = bounds.getNorthEast();
		//百度坐标转墨卡托
		leftBottom = _convertLL2MC(leftBottom);
		rightTop = _convertLL2MC(rightTop);
		var unitSize = Math.pow(2, 18-zoom) * 256;
		//瓦片行x
		var xMin = Math.floor(leftBottom.lng / unitSize);
		var xMax = Math.floor(rightTop.lng / unitSize);
		//瓦片列y
		var yMin = Math.floor(leftBottom.lat / unitSize);
		var yMax = Math.floor(rightTop.lat / unitSize);
		//瓦片个数
		var count = (xMax-xMin+1) * (yMax-yMin+1);
		/*
		for(var i=xMin; i<=xMax; i++){
			for(var j=yMin; j<=yMax; j++){
				组合瓦片 zoom/x/y.png
			}
		}
		*/
		var r = {"zoom":zoom,"count":count, "xMin":xMin, "xMax":xMax, "yMin":yMin, "yMax":yMax};
		console.log(r);
		return r;
	}
	
	//来自https://my.oschina.net/smzd/blog/530105
	//地球半径
	var EARTHRADIUS = 6370996.81; 
	//百度坐标转墨卡托
	var LLBAND = [ 75, 60, 45, 30, 15, 0 ];
	var LL2MC = [
		[ -0.0015702102444, 111320.7020616939,1704480524535203, -10338987376042340,26112667856603880, -35149669176653700,26595700718403920, -10725012454188240,1800819912950474, 82.5 ],
		[ 0.0008277824516172526, 111320.7020463578,647795574.6671607, -4082003173.641316,10774905663.51142, -15171875531.51559,12053065338.62167, -5124939663.577472,913311935.9512032, 67.5 ],
		[ 0.00337398766765, 111320.7020202162,4481351.045890365, -23393751.19931662,79682215.47186455, -115964993.2797253,97236711.15602145, -43661946.33752821,8477230.501135234, 52.5 ],
		[ 0.00220636496208, 111320.7020209128,51751.86112841131, 3796837.749470245,992013.7397791013, -1221952.21711287,1340652.697009075, -620943.6990984312,144416.9293806241, 37.5 ],
		[ -0.0003441963504368392, 111320.7020576856,278.2353980772752, 2485758.690035394,6070.750963243378, 54821.18345352118,9540.606633304236, -2710.55326746645,1405.483844121726, 22.5 ],
		[ -0.0003218135878613132, 111320.7020701615,0.00369383431289, 823725.6402795718,0.46104986909093, 2351.343141331292,1.58060784298199, 8.77738589078284,0.37238884252424, 7.45 ] 
	];
	
	function _Point(lng, lat){
		this.lng = lng;
		this.lat = lat;
	}
	 
	function _convertor(point, ll2mc) {
		if (!point || !ll2mc) {
			return
		}
		// 经度的转换比较简单，一个简单的线性转换就可以了。
		// 0、1的数量级别是这样的-0.0015702102444, 111320.7020616939
		var x = ll2mc[0] + ll2mc[1] * Math.abs(point.lng);
		// 先计算一个线性关系，其中9的数量级是这样的：67.5，a的估值大约是一个个位数
		var a = Math.abs(point.lat) / ll2mc[9];
		// 维度的转换相对比较复杂，y=b+ca+da^2+ea^3+fa^4+ga^5+ha^6
		// 其中，a是维度的线性转换，而最终值则是一个六次方的多项式，2、3、4、5、6、7、8的数值大约是这样的：
		// 278.2353980772752, 2485758.690035394,
		// 6070.750963243378, 54821.18345352118,
		// 9540.606633304236, -2710.55326746645,
		// 1405.483844121726,
		// 这意味着维度会变成一个很大的数，大到多少很难说
		var y = ll2mc[2] + ll2mc[3] * a + ll2mc[4] * a * a + ll2mc[5] * a
		* a * a + ll2mc[6] * a * a * a * a + ll2mc[7] * a
		* a * a * a * a + ll2mc[8] * a * a * a * a
		* a * a;
		// 整个计算是基于绝对值的，符号位最后补回去就行了
		x *= (point.lng < 0 ? -1 : 1);
		y *= (point.lat < 0 ? -1 : 1);
		// 产生一个新的点坐标
		return new _Point(x, y)
	}
	 
	function _lngLatToMercator(T) {
		return _convertLL2MC(T);
	}
	 
	function _getLoop(value, min, max) {
		while (value > max) {
			value -= max - min
		}
		while (value < min) {
			value += max - min
		}
		return value
	}
	
	//百度坐标转墨卡托
	function _convertLL2MC (point) {
		var point1;
		var ll2mc;
		point.lng = _getLoop(point.lng, -180, 180);// 标准化到区间内
		point.lat = _getLoop(point.lat, -74, 74);// 标准化到区间内
		point1 = new _Point(point.lng, point.lat);
		// 查找LLBAND的维度字典，字典由大到小排序，找到则停止
		for (var i = 0; i < LLBAND.length; i++) {
			if (point1.lat >= LLBAND[i]) {
				ll2mc = LL2MC[i];
				break;
			}
		}
		// 如果没有找到，则反过来找。找到即停止。
		if (!ll2mc) {
			for (var i = LLBAND.length - 1; i >= 0; i--) {
				if (point1.lat <= -LLBAND[i]) {
					ll2mc = LL2MC[i];
					break;
				}
			}
		}
		var newPoint = _convertor(point, ll2mc);
		var point = new _Point(newPoint.lng.toFixed(2), newPoint.lat.toFixed(2));
		return point;
	}
		
})();
