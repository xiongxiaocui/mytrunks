/**
 * 签到逻辑组件
 * 页面地址：http://m.letv.com/izt/zongyi_qyjs
 * Created by liwenliang on 11/3/15.
 */
define(function (require, exports, module) {
	'use strict';
	var Sign = require('./sign/sign');
	var SignInstance = {
		/**
		 * 代码初始化
		 */
		init: function (config) {
			if (!config.domId) {
				return;
			}
			this.sign = new Sign();
			this.sign.init(config);
		}
	};
	module.exports = SignInstance;
});
