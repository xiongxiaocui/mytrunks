/**
 * @fileoverview 2015 直播页全局事件
 * @authors liuxiaoyue3@letv.com
 * @date 20151018
 */
define(function (require, exports, module) {

	/*--
		-dict -create live_events 直播页全局事件，包含播放器事件
		-dict switch-tab requestPicTextLive 触发图文tab
		-dict switch-tab requestInteract  触发互动tab
		-dict switch-tab requestLiveChat 触发聊天室tab
	*/
	module.exports = require('air/event/givee')({});
	
});