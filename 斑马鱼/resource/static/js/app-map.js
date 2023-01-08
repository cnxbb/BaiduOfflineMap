//百度在线地图API, 只能是map，名字改不了去tiles有问题，不知道为何?
var map = null;
var mapGeoc = null;
//瓦片获取
var tilesMng = null;

$(function(){
		if( typeof BMap == 'undefined' ){
			layer.alert('百度地图需要在联网的情况下，才能下载！');
		}
		else {
			map = new BMap.Map('main-content',{mapType: BMAP_NORMAL_MAP});
			var point = new BMap.Point(116.404, 39.915);    // 创建点坐标
			map.centerAndZoom(point,9);                     // 初始化地图,设置中心点坐标和地图级别。
			map.setMinZoom(5);
			map.setMaxZoom(19);
			map.addControl(new BMap.MapTypeControl({mapTypes: [BMAP_NORMAL_MAP,BMAP_SATELLITE_MAP,BMAP_HYBRID_MAP],anchor: BMAP_ANCHOR_TOP_RIGHT}));     //地图类型
			map.addControl(new BMap.NavigationControl({anchor: BMAP_ANCHOR_TOP_LEFT}));  //缩放
			map.enableScrollWheelZoom();                  // 启用滚轮放大缩小
			
			//逆地址解析
			mapGeoc = new BMap.Geocoder();
			
			//瓦片地址获取
			tilesMng = new BMapLib.BoundsTiles(map);
			//test 当前级别的瓦片地址
			if( 1 ) {
				var z = map.getZoom();
				var c = tilesMng.getTilesInfo(map.getBounds(), z);
				tilesMng.getTiles(c, function(path, url){
					console.log(path +"==>"+ url);
				});
			}
			mapMng.init();
			setTimeout(function(){layer.tips('这里切换地图类型', $('div[title="显示普通地图"]'), {tips: 3});}, 4000);
			setTimeout(function(){layer.tips('这里搜索地点', $('#search_map_value'), {tips: 3});}, 2000);
			
			//window.openBMapDown("BMapDown.exe", "C:\\Users\\guojian\\baiduMap_江苏省镇江市.tiles");
		}
});

//在线地图控制接口
mapMng = {
	init: function() {
		this.currentPosition(); //请求当前位置
		this.customControl(); //按钮控制action
		this.initDownload(); //初始化下载页面
		this.addSearch(); //搜索支持
	},
	//请求当前位置
	currentPosition: function() {
    (new BMap.Geolocation).getCurrentPosition(function(b) {
        if (this.getStatus() == BMAP_STATUS_SUCCESS) {
            map.panTo(b.point)
        }
    }, {
        enableHighAccuracy: !0
    })
	},
	//按钮控制action
	customControl: function(){
    //鼠标绘图
    var opt = {
      strokeColor: "red",
      fillColor: "red",
      strokeWeight: 1,
      strokeOpacity: .5,
      fillOpacity: .1,
      strokeStyle: "solid"
    }, drawMng = new BMapLib.DrawingManager(map, {
      isOpen: !1,
      enableDrawingTool: !1,
      drawingToolOptions: {
          anchor: BMAP_ANCHOR_TOP_RIGHT,
          offset: new BMap.Size(5, 5)
      },
      circleOptions: opt,
      polylineOptions: opt,
      polygonOptions: opt,
      rectangleOptions: opt
    });
    //矩形绘制完毕
    drawMng.addEventListener("rectanglecomplete", function(overlay) {
      drawMng.close();
      mapMng.activeCustomControl('#map-drag-btn');
      mapMng.openDownload(overlay);
    });
    //拖动
		$('#map-drag-btn').on('click', function(){
			mapMng.activeCustomControl(this);
      drawMng.close();
      map.clearOverlays();
      map.setDefaultCursor("pointer");
      layer.tips('按下左键可拖动地图', this, {tips: 3});
      map.removeEventListener("click", mapMng.clickFunc);
		});
    //绘制矩形
		$('#map-down-btn').on('click', function(){
			mapMng.activeCustomControl(this);
      map.clearOverlays();
      drawMng.close();
      drawMng.setDrawingMode(BMAP_DRAWING_RECTANGLE);
      drawMng.open();
      layer.tips('按下左键并拖动，绘制区域', this, {tips: 3}); 
      map.removeEventListener("click", mapMng.clickFunc);
		});
    //取坐标点
		$('#map-point-btn').on('click', function(){
			mapMng.activeCustomControl(this);
      map.clearOverlays();
      map.setDefaultCursor("default");
      layer.tips('左键点击地图，获得经纬度', this, {tips: 3});
      map.addEventListener("click", mapMng.clickFunc);
		});
		
	},
  clickFunc: function(hit){
    layer.alert('<div style="font-size:16px;">经度: '+ hit.point.lng + '<br/>纬度: '+hit.point.lat+'</div>',{title:'经纬度坐标'} );
  },
	//隐藏控制按钮
	hideCustomControl: function(){
		$('#map-btns').hide();
	},
	//显示控制按钮
	showCustomControl: function(){
		$('#map-btns').show();
	},
  //按钮激活状态
	activeCustomControl: function(btn){
		$("#map-btns button").each(function() {
			$(this).removeClass("btn-warning");
			$(this).addClass("btn-secondary")
    });
		$(btn).removeClass("btn-secondary");
    $(btn).addClass("btn-warning");
	},
	//搜索地图
	addSearch: function(){
		(new BMap.Autocomplete({
            input: "search_map_value",
            location: map
        })).addEventListener("onconfirm", function(b) {
            b = b.item.value;
            mapMng.setPlace(b.province + b.city + b.district + b.street + b.business)
        });
        $("#search_map_btn").click(function() {
            var b = $("#search_map_value").val().trim();
            mapMng.setPlace(b)
						
						
			})
	},
	//定位地点
	setPlace: function(b) {
        map.clearOverlays();
        var d = new BMap.LocalSearch(map, {
            onSearchComplete: function() {
                var b = d.getResults().getPoi(0).point;
                map.centerAndZoom(b, 16);
                map.addOverlay(new BMap.Marker(b))
            }
        });
        d.search(b)
   },
	//初始化下载框
	initDownload: function(){
		//全选/不选
		$('#chk-select-all').click(function(e){
			var chk = $(this).prop('checked');
			$('input[name="chk-zoom-tiles"]').each(function(e){
				$(this).prop('checked', chk);
			});
			mapMng.statDownload();
		});
		//选择目录
		$('#tiles-dir-btn').click(function(e){
			//调用cpp中的函数
			var dir = window.selectDir();
			if( dir ){
				$('#tiles-dir').val(dir);
			}
		});
		//确认
		$('#down-confirm').click(function(e){
			var count = 0;
			var zooms = ""; //[];
			//记录选择的瓦片
			$('input[name="chk-zoom-tiles"]').each(function(e){
					if( $(this).prop('checked') ){
						var a = $(this).val().split('/'); // 级别/个数/xMin/xMax/yMin/yMax
						if( a.length == 6 ){
							count += parseInt(a[1]);
							//zooms.push( a );
							zooms += $(this).val()+"|";
						}
					}
			});
			
			//必要的验证
			if( count <= 0 ) {
				layer.alert('请选择瓦片!');
				return;
			}
			var desc = $('#tiles-desc').val();
			var sdir = $('#tiles-dir').val();
			if(desc.length < 1 ){
				layer.alert('请输入瓦片信息描述，如：某某市!');
				return;
			}
			if(sdir.length < 2 ){
				layer.alert('请选择存储目录，建议是空目录!');
				return;
			}
			console.log(zooms);
			layer.msg('正在收集信息，需要一些时间，之后才启动下载.', {offset: 'b'});
			layer.load(0, {time: 60*1000});
			
			//地图类型
			var mname = map.getMapType().getName();
      //地图类型0,1不能改。1表示卫星和混合地图都下载
			var mtype = (mname=="卫星" || mname=="混合" || mname.indexOf('卫星') >= 0 ) ? 1 : 0; //0普通地图
			//调用aardio函数，创建任务sqlite
			var dbname = mapMng.getTaskDbName(desc);
			$('#tiles-process').show();
			$('#tiles-process-per').text('0%');
			//调用win32中的函数生成sqlite3
			var ret = window.createTask(sdir, dbname, desc, count, mtype, zooms, function(pro,str){
				//layer.msg('收集瓦片信息: '+pro.toFixed(2)+'%', {offset: 'b'});
				$('#tiles-process-per').text(pro.toFixed(2)+'%');
				
				if(pro>=100) {
						layer.closeAll();
						$('#down-modal').modal('hide');
						
						//调用下载程序
						var dbPath = str;
						//layer.alert(dbPath);
						var dr = window.openBMapDown("BMapDown.exe", dbPath);
						if(dr != 1){
							layer.alert(dr); //失败的原因
						}
				}
				else if(pro < 0){
					layer.alert(str);
				}
			});
			if( ret != 1 ) {
				layer.closeAll();
				layer.alert(ret);
			}
		});
		
	},
	getTaskDbName: function(desc){
		desc = desc.trim();
		desc = desc.replace(/[\\\/:*?"<>|]+/g, '-'); //替换特殊字符
		return 'baiduMap_'+ desc +".tiles";
	},
	//统计选择瓦片数量
	statDownload: function(){
		var count = 0;
		var size = 0;
		$('input[name="chk-zoom-tiles"]').each(function(e){
				if( $(this).prop('checked') ){
					var a = $(this).val().split('/'); // 级别/个数/xMin/xMax/yMin/yMax
					if( a.length == 6 ){
						count += parseInt(a[1]);
					}
				}
		});
		size = count * 10; //瓦片平均10Kb
		if( size < 1024 ) {
			size = size +' K';
		}
		else if( size < 1024*1024 ) {
			size = (size/1024.0).toFixed(2) +' M';
		}
		else {
			size = (size/1024.0/1024.0).toFixed(2) +' G';
		}
		$('#tiles-count').text(count);
		$('#tiles-size').text(size);
		return count; //must
	},
  //弹出下载窗口
  openDownload: function(overlay) {
    var bounds = overlay.getBounds();
    //计算瓦片数量
		var thtml = "";
    for(var z=4; z<=19; z++) {
      var tc = tilesMng.getTilesInfo(bounds, z);
			thtml += '<tr><td><input type="checkbox" onclick="mapMng.statDownload()" name="chk-zoom-tiles" value="'+tc.zoom+'/'+tc.count+'/'+tc.xMin+'/'+tc.xMax+'/'+tc.yMin+'/'+tc.yMax+'"/></td>';
			thtml += '<td>'+tc.zoom+'</td>';
			thtml += '<td>'+tc.count+'</td></tr>';
    }
		$('#chk-select-all').prop('checked', false);
		$('#tiles-desc').val('');
		$('#tiles-dir').val('');
		$('#tiles-local').text('定位中..');
		$('#tiles-count').text('0');
		$('#tiles-size').text('0');
		$('#tiles-process').hide();
		$('#table-body-tiles').html(thtml);
		
		mapGeoc.getLocation(bounds.getCenter(), function(rs){
		    var addComp = rs.addressComponents;
		    $('#tiles-local').text(addComp.province + ", " + addComp.city);
		    if( $('#tiles-desc').val()=="" ){
		        $('#tiles-desc').val(addComp.province + addComp.city);
		    }
		});
		
    $('#down-modal').modal({keyboard:false});
  }
	
};
