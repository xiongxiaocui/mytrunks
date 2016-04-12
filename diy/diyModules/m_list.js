define(function (require, exports, module) {
    var AlbumPid = function (opt) {
	    this.default_opt = $.extend({
	      	/*contID: "", //内容层的id号
	      	pageID: "", //分页层的id页*/
	      	modleId:"",
	      	count: 9, //每页显示多少条数据
	      	pageClass: 'on', //分页时移入样式
	      	rost: 1, //分页排序方式排序
	      	//180001 正片, 180002 预告片, 180003 花絮, 180004 资讯, 180005 其他
	      	Info: "video", //视频类型 分为5个类型 ： video,huaxu,other,yugaopian,zixun
	      	imgSize:"200*150", //图片的尺寸
	      	channelType:''
	    }, opt);
	    this.contID = $(this.default_opt.modleId).find(".ztm_imgTxt");
	    this.pageID = $(this.default_opt.modleId).find(".ztm_page");
	    //电影、电视剧、综艺、动漫、纪录片 需要区分正片和非正片，其他不区分
	    this.channel = this.default_opt.channelType;
	    this.needType = 'movie,tv,zongyi,comic,jilu,'.indexOf(this.channel) > -1;
	    this.typeInfo = ''; 
	    this.init();                                                                  
	};
	AlbumPid.prototype = {
		init: function (){
			this.initpage();
			this.pageID.trigger("click");
		},
		//类型匹配
		typeHash: {
			video: '180001',
		    yugaopian: '180002',
		    huaxu: '180003',
		    zixun: '180004',
		    other: '180005'
		},
	    initpage: function () {
	      	var byteLength = require('air.string.byteLength');
	      	var scrollingLoader = require('air.util.scrollingLoader');
	      	var _this = this;
	      	this.getType();
	
	      	var n = 1;
			var opt = {
				// maxTimes: 9,
				$loadBtn: _this.pageID,
				loadData: function () {
					$.getJSON(le.api_host.api + '/mms/out/albumInfo/getAllVideoList?platform=web&callback=?', {s:_this.default_opt.count, b:n, id:_this.default_opt.pid, o:_this.default_opt.rost||'-1', type:_this.typeInfo, p:420001}, function(data){
		              	var data= data.data;
		              	if (!data) {
		              		_this.pageID.hide();
		              		return false;
		              	}
		              	var videoData = data.videoInfo,
		                	html = "",
		                	len = videoData.length;
		                if (len < _this.default_opt.count) {
		                	_this.pageID.hide();
		                }
		              	for (var i = 0; i < len; i++){
		                	var name = videoData[i].nameCn;
		            		// createTime
		                	html+='<li class="f-fl">'+
								    '<div class="w20">&nbsp;</div>'+
								     '<dl class="ztm_imgTxt_unSub">'+
								      '<dd class="ztm_imgTxt_img">'+
								      	'<a title="' + name + '" href="'+ le.api_host.m_href +'/vplay_' + videoData[i].id + '.html?cid='+__INFO__.cid+'&pid='+videoData[i].pid+'">'+
								      	 '<img  src="http://i2.letvimg.com/lc05_img/201601/07/17/39/1739/letvImg.png" alt="'+name+'" data-url="'+((videoData[i].picAll && videoData[i].picAll[_this.default_opt.imgSize]) ? videoData[i].picAll[_this.default_opt.imgSize] : "")+'">'+
								      	 '<small></small>'+
								      	 '<i class="dt_bg"></i> <b class="dt_txt">'+videoData[i].createTime.substr(5,11)+'</b>'+
								      	'</a>'+
								      '</dd>'+
								      '<dt class="ztm_imgTxt_title">'+
								      	'<a title="' + name + '" href="'+ le.api_host.m_href +'/vplay_' + videoData[i].id + '.html">'+name+'</a>'+
								      '</dt>'+
								    '</dl>'+
								    '<div class="w10">&nbsp;</div>'+
								  '</li>'
							
		            	}
		            	_this.contID.append(html);
						Zepto('img[data-url]').imglazyload();
		        	});
					n++;
				}
			};
			new scrollingLoader(opt);
	    },

	    //获取类型
	    getType: function () {
	    	//'video,yugaopian,huaxu,zixun,other'的长度是33，如果都选了，那就不区分了
	    	
	      	if (this.needType && this.default_opt.Info.length<33) {

	        	var reg_b = /\s/g,
	         	 	typeDefault = this.default_opt.Info.split(','),
	          		typeArr = [], type;
		        for(var i = 0, len = typeDefault.length; i < len; i++){
		          	type= this.typeHash[typeDefault[i].replace(reg_b,'')];
		          	type && typeArr.push(type);
		        }
		        this.typeInfo = typeArr.join(',');
		        //综艺的并且勾选了正片的，要加上片段
		        if(this.channel==='zongyi' && this.typeInfo.indexOf('180001')>-1){
		          	//182202 片段
		          	this.typeInfo += ',182202';
		        }
	    	}
	    }
  }
	module.exports = AlbumPid;
});