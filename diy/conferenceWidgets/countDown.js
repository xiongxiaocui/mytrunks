/**
 * M站倒计时组件 todo 专题编辑页面没有组件
 */
define(function (require, exports, module) {
	'use strict';
	var CountDown = require('../conference/countDown');
	var CountDownInstance = {
		/**
		 * 组件初始化代码入口
		 * @param config 挂件参数
		 * config.domId 倒计时添加到的结构
		 * config.deadLine 最终时间
		 * @returns {*} 返回组件对象
		 */
		init: function (config) {
			if (!config.domId || !config.deadLine) {
				return;
			}
			this.countDown = new CountDown();
			this.countDown.init(config);
		}
	};
	module.exports = CountDownInstance;
});