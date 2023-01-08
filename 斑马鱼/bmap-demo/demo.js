  
  if( typeof map != 'undefined' ){
    map.addEventListener("zoomend", function(e){
      layer.msg('地图级别: '+map.getZoom() + (map.getZoom() > 8?', 示例中只有8级地图,超过的无法显示!':''), {'offset':'b'});
    });
  }
  if( typeof map2 != 'undefined' ){
    map2.addEventListener("zoomend", function(e){
      layer.msg('地图级别: '+map.getZoom() + (map.getZoom() > 8?', 示例中只有8级地图,超过的无法显示!':''), {'offset':'b'});
    });
  }