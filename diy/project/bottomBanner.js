/**
 * 底部导流位组件
 * 页面地址：http://m.letv.com/izt/zongyi_qyjs
 * Created by liwenliang on 11/5/15.
 */
define(function (require, exports, module) {
	'use strict';
	var BottomBanner = require('./bottomBanner/bottomBanner');
	var BottomBannerInstance = {
		/**
		 * 代码初始化
		 */
		init: function (config) {
			if (!config.domId) {
				return;
			}
			this.bottomBanner = new BottomBanner();
			this.bottomBanner.init(config);
		}
	};
	module.exports = BottomBannerInstance;
});