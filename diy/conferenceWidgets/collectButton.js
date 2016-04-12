/**
 * M站收藏按钮组件 todo 专题编辑页面没有组件
 */
define(function (require, exports, module) {
	'use strict';
	var CollectButton = require('../conference/collectButton');
	var CollectButtonInstance = {
		/**
		 * 组件初始化代码入口
		 * @param config 挂件参数
		 * config.domId 收藏按钮节点id
		 * @returns {*} 返回组件对象
		 */
		init: function (config) {
			if (!config.domId) {
				return;
			}
			this.collectBtn = new CollectButton();
			this.collectBtn.init(config);
		}
	};
	module.exports = CollectButtonInstance;
});