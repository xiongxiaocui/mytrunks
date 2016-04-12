/**
 * M站点播播放器挂件
 */
define(function (require, exports, module) {
	'use strict';
	var Player = require('./diyModules/vodPlayer');
	var VodPlayer = {
		init: function (config) {
			var id = config.videoId;
			if (id) {
				this.player = new Player();
				this.player.init(config);
			}
		}
	};
	module.exports = VodPlayer;
});