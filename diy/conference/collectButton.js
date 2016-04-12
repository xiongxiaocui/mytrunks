/**
 * 微信收藏按钮组件
 * 逻辑：
 * 1.微信环境显示，非微信环境不显示
 * 2.点击展示浮层，指向微信右上角引导用户收藏
 */

define(function (require, exports, module) {
	'use strict';
	var shareBase = require('components/share/share_base');
	var CollectButton = function (opt) {
	};
	CollectButton.prototype = {
		/**
		 * 初始化收藏按钮
		 */
		init: function (config) {
			this.initDom(config);
			this.initEvent();
		},

		/**
		 * 初始化组件的变量与节点
		 */
		initDom: function (config) {
			this.collectBtn = $('#' + config.domId);
			this.dataAp = config.dataAp || '';
			this.codeAp = config.codeAp;
			if (navigator.userAgent.match(/MicroMessenger/i) != null) {
				this.isInWeiXin = true;
				//this.collectBtn.show();
				this.collectBtn.css('display','block');
			}
		},

		/**
		 * 初始化点击事件
		 */
		initEvent: function () {
			if (this.isInWeiXin) {
				this.collectBtn.on('click', $.proxy(this.doCollect, this));
			}
		},

		/**
		 * 执行收藏逻辑
		 */
		doCollect: function () {
			var _self = this;
			shareBase.weixinCollect();
			if (this.dataAp !== '') {
				setTimeout(function () {
					Stats.sendAction({
						ap: _self.dataAp
					});
				}, 0);
			}
			if (this.codeAp){
				Stats.feStat(this.codeAp);
			}
		}
	};
	module.exports = CollectButton;
});