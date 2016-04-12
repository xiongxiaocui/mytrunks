/*
 ## 直播DIY播放页播放器底部导流banner selina
 ### config = {
 domId:'' //元素id
 }
 */
__req('ms::modules/open_app.js');
define(function (require, exports, module) {
	'use strict';
	var BottomBanner = function () {
	};
	BottomBanner.prototype = {
		init: function (config) {
			var ua = navigator.userAgent;
			if (/letvclient/i.test(ua) || /letvmobileclient/i.test(ua) || /LetvMobileClient\s+Android;letv;/i.test(ua) || /leuibrowser|eui browser/i.test(ua)) return;
			this.config = config;
			if (!this.config.domId) {
				return;
			}
			this._initDom();
			this._initEvent();
		},
		_initDom: function () {
			this._tip = $('#' + this.config.domId);
			this._tip.show();
		},
		_initEvent: function () {
			this._tip.on('click', $.proxy(this._open, this));
		},
		_open: function (e) {
			e.preventDefault();
			var _self = this;
			__openApp._bindDefaultAppEvent({
				'url': _self.config.url || le.api_host.app_m + '/download_general.php?ref=010111019',
				'wxUrl': _self.config.wxUrl || 'http://a.app.qq.com/o/simple.jsp?pkgname=com.letv.android.client&ckey=CK1315505951124',
				'app': 'letv',
				'type': 'webview',
				'weburl': window.location.href
			});
		}
	};
	module.exports = BottomBanner;
});