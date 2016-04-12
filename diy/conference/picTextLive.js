/**
 * @fileoverview 2015 图文直播组件 包括聊天室 互动 活动规则tab
 * @authors liuxiaoyue3@letv.com
 * @date 20151018
 */
/**
 * @fileoverview 2015 图文直播组件 包括聊天室 互动 活动规则tab
 * @authors liuxiaoyue3@letv.com
 * @date 20151018
 */
__req('lib::bootstrap-tab.js');//tab切换组件
define(function(require,exports,module){
	var events = require('./events');
	var picTextLive = require('./picText/picTextLive');
	var chat = require('./chat/chat');
	//下面为添加互动tab
	var interact = require('./interact/interactTab');
	var relationTab = require('./relationVideo/relationTab');

	var picTextComp = function(){};

	picTextComp.prototype = {
		/**
		 * 初始化
		 * @param config
		 */
		init: function (config) {
			this.initDom(config);
			this.initPage();
		},

		/**
		 * 变量与节点初始化
		 * @param config
		 */
		initDom: function(config){
			this.config = config;
			var widgetId = config.widgetId;
			this.$picTextWrap = $('#picTextWrap_' + widgetId);
			this.$chatRoomWrap = $('#chatRoomWrap_' + widgetId);
			this.$interactWrap = $('#interactWrap_' + widgetId);
			this.$relationWrap = $('#relationWrap_' + widgetId);
		},

		/**
		 * 页面逻辑初始化
		 */
		initPage: function () {
			var config = this.config;
			//需要兼容通用直播页，因此得允许空值的情况
			if (config.widgetId||config.widgetId=='') {
				if (this.$picTextWrap.length > 0) {
					//触发图文tab
					events.emit('requestPicTextLive', config);
				}
				if (this.$chatRoomWrap.length > 0) {
					//触发聊天室
					events.emit('requestLiveChat', config);
				}
				if (this.$interactWrap.length > 0) {
					//互动初始化
					interact.init(config);
				}
				if (this.$relationWrap.length > 0) {
					// 相关初始化
					relationTab.init(config);
				}
				//初始化tab切换
				this.initSwitchTabEvent(config);
			}
		},

		/**
		 * 初始化tab切换事件
		 * @param config
		 */
		initSwitchTabEvent : function(config){

			var _self = this;
			var tabs = $('#tabNav_' + config.widgetId+ ' a[data-toggle="tab"]');

			tabs.on('shown',function(e){
				var href = e.target.href;
				//图文直播
				if(href.indexOf('#commentary') > -1){
					events.emit('requestPicTextLive',config);
				}
				if(href.indexOf('#commentary') == -1){
					events.emit('stopPicTextLive');
				}
				//聊天室
				if(href.indexOf('#chat') > -1){
					events.emit('requestLiveChat',config);
					events.emit('stopBubbleChat');
				}
				if(href.indexOf('#chat') == -1 && _self.$chatRoomWrap.length > 0){
					events.emit('stopRenderLiveChat');
					events.emit('startBubbleChat');
				}
				//互动
				if(href.indexOf('#interact') > -1){
					events.emit('requestInteract');
				}
				//相关
				if (href.indexOf('#relation') > -1) {
					events.emit('requestRelationTab');
				}
			});
		}
	};

	module.exports = picTextComp;
});