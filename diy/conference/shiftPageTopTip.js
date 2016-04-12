/**
 * @fileoverview 2015 时移页面顶部tip
 * @authors liuxiaoyue3@letv.com
 * @date 20151018
 */
define(function(require,exports,module){
	var isShiftPage = require('./isShift');
	var events = require('./events');

	var shiftPageTopTip = {
		init : function(config){
			var wrap = $('#liveShift' + config.widgetId);
			var that = this;
			events.on('showShiftLayer',function(){
				that.initDom(wrap);
				//直播中 才绑定事件
				if(info.liveStatus === '2'){
					that.initEvent(wrap);
				}
			});
		},
		initEvent : function(wrap){
			wrap.find('.ico_backplay').on('click', function(){
				info.livePlayer.livePlayer.backToLive();
				wrap.hide();
			});
		},
		initDom : function(wrap){
			var isShift = isShiftPage();
			//直播中 并且是分享页
			if(isShift.is && info.liveStatus === '2'){
				wrap.show();
				wrap.find('.ico_backplay').show();
			}
			//直播转码中 不分是分享页 都一直展示tip
			if(info.liveStatus === '3'){
				wrap.show();
			}
		}
	};

	module.exports = shiftPageTopTip;
});