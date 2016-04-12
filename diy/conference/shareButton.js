/**
 * M站专题DIY分享按钮
 */

define(function (require, exports, module) {
	'use strict';
	// 引入appH5Adapter
	var ua = require('air/env/ua');
	//非常恶心的写法 别问为什么
	if(ua.weixin){
		info.share.customCallback = function() {
			Stats.feStat(config.codeAp);
		};
	}
	var shareBase = require('components/share/share_base');
	require('components/app/apph5Adapter');
	var ShareButton = function (opt) {
	};
	ShareButton.prototype = {
		/**
		 * 初始化倒计时按钮
		 */
		init: function (config) {
			this.initDom(config);
			this.initEvent();
		},

		/**
		 * 初始化组件的变量与节点
		 */
		initDom: function (config) {
			if (!config.domId) {
				return;
			}
			this.shareBtn = $('#' + config.domId);
			this.dataAp = config.dataAp || '';
			this.codeAp= config.codeAp;
			var defaultShareInfo = window.info && window.info.share;
			if (window.info && window.info.share) {
				defaultShareInfo = window.info.share;
			}
			
			this.shareInfo = config.shareInfo || defaultShareInfo;

			if(navigator.userAgent.match(/MicroMessenger/i)!= null){
				this.isInWeiXin = true;
				this.shareBtn.find('i').removeClass('icon_share1').addClass('icon_share2');
				this.shareBtn.find('b').html('立即分享到朋友圈');
			}
		},

		/**
		 * 初始化点击事件
		 */
		initEvent: function () {
			if (!this.shareBtn) {
				return;
			}
			this.shareBtn.on('click', $.proxy(this.doShare, this));
		},

		/**
		 * 执行分享逻辑
		 */
		doShare: function () {
			var _self = this;
			if (this.isInWeiXin) {
				shareBase.weixinShare();
			} else {
				le.app.callShare(this.shareInfo, function(){});
			}
			
			if (_self.dataAp !== '') {
				setTimeout(function () {
					Stats.sendAction({
						ap: _self.dataAp
					});
				}, 0);
			}
		}
	};
	module.exports = ShareButton;
});