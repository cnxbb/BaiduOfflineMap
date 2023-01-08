# 引子
    最近一个WEB项目需求在纯局域网下显示设备定位，以前用惯了百度地图JS版 现在没外网了只有搞离线版了。百度官网是没有离线的JS版本，网上搜索了一圈下了不少评论中说好用的版本其中还花了十几块Down了个号称好用的。 本想着应该是妥妥的了，结果欠差人意，花钱的ZIP包中只有2个JS文件，其他的zip包里各种自己封装的JS和一些零星的地图瓦片。用基本都能用，问题集中在地图瓦片的获取上，于是在网上又找了不少瓦片下载工具，要么是过期下不到，要么是需要充钱才能用。最后聚焦在“斑马鱼”这款工具，1.免费2.功能也基本满足需求。 框选了个南京市大概范围 4-19级地图瓦片一共420多万个，软件提供50个线程同时下载 貌似不错 弄到凌晨5点多开下，一觉睡醒下午1点半。才下载了120多万条数据感觉有点懵逼 这下载速度有点鸡肋！！这玩不转啊，才只是一个南京市的瓦片的下载就需要这么长时间，要是搞几个省的，等这项目开始部署了瓦片也下不完呀。想办法提高瓦片下载的效率吧。 
# 开搞、提速
    研究了下“斑马鱼”，它有2个程序BMapTool.exe、BMapDown.exe。
    BMapTool用来显示地图，框选下载区域，生成下载任务。
    BMapDown读取下载任务，下载瓦片数据。
    WinHex 打开生成的下载任务文件“xxxxx.tiles” 发现是个SQLite3数据库 里面3张表 task、tiles、zoom，从名字上看就知道各个表里是什么数据了。 再打开抓包工具看下瓦片是从哪下的，一目了然 URL是http://online3.map.bdimg.com/tile/?qt=vtile&x=6&y=1&z=5&styles=pl&scaler=1 其中参数 x y z 正好对应 tiles 表中 x y z 3个字段 那flag字段估计就是下载成功与否的标志位了。这下简单了所有需要下载的瓦片的URL都有了接下来就是提高下载工作的效率了的事了。“斑马鱼”下载慢主要原因应该是它对下载工作的调度的问题，还有就是本地网络下载速度的问题。
    原因1：我在虚拟机里（win7 64位 2核）跑BMapDown下载数还一直跳个不停（网上下的EXE程序总是要先扔到虚拟机里跑下，抓下网络包看看它到底访问了什么网络，Procmon看下读取了哪些本地资源，看明白了才敢放在真机环境下跑）真机环境（win10 64位 16核）下载数下半天才跳一下。真机环境下载竟然比虚拟机慢一万倍，日了鬼了。
    原因2：书房于客厅隔了两道墙WIFI信号不是满格。
    解决方案：把下载工作直接扔到服务器上搞了事。dltiles.go 是 go写的瓦片下载程序。
    使用方法: 
    服务器先安装go
        wget https://golang.google.cn/dl/go1.17.5.linux-amd64.tar.gz
        tar zxvf go1.17.5.linux-amd64.tar.gz
        mv go /var/golang.17.5
        rm go1.17.5.linux-amd64.tar.gz -rf
        cd /usr/local/bin/
        ln -s /var/golang.17.5/bin/go go
        ln -s /var/golang.17.5/bin/gofmt gofmt
        go env -w GO111MODULE=auto
        然后下载SQLite依赖包
        go get github.com/mattn/go-sqlite3
        编译使用
            go build dltiles.go
            ./dltiles xxx.ltiles(斑马鱼的SQLite任务文件) /download/tiles/(瓦片保存路径) >> tiles.log
        或 直接 go run dltiles.go xxx.dltiles(斑马鱼的SQLite任务文件) /download/tiles/(瓦片保存路径) >> tiles.log
    现在下载效率比PC上搞，快的起飞了420万多个瓦片 54分钟 搞定。
