/**
 * M站焦点图组件
 */
define(function (require, exports, module) {
	'use strict';
	var FocusScroll = require('components/common_focus');
	var FocusObj = {
		/**
		 * 组件初始化代码入口
		 * @param config 挂件参数 config.domId 为必填
		 * @returns {*} 返回组件对象
		 */
		init: function (config) {
			var domId = config.domId;
			return new FocusScroll($('#' + domId));
		}
	};
	module.exports = FocusObj;
});