/**
 * M站分享按钮组件 todo 专题编辑页面没有组件
 */
define(function (require, exports, module) {
	'use strict';
	var ShareButton = require('../conference/shareButton');
	var ShareButtonInstance = {
		/**
		 * 组件初始化代码入口
		 * @param config 挂件参数
		 * config.domId 分享按钮节点id
		 * config.shareInfo 分享信息
		 * @returns {*} 返回组件对象
		 */
		init: function (config) {
			if (!config.domId) {
				return;
			}
			this.shareBtn = new ShareButton();
			this.shareBtn.init(config);
		}
	};
	module.exports = ShareButtonInstance;
});