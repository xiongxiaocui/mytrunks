/**
 * M站直播播放器挂件
 */
define(function (require, exports, module) {
	'use strict';
	var LivePlayer = require('./diyModules/livePlayer');
	var LiveVideoObj = {
		init: function (config) {
			if (config.liveInfo) {
				this.livePlayer = new LivePlayer();
				this.livePlayer.init(config);
			}
		}
	};
	module.exports = LiveVideoObj;
});