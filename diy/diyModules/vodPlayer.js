/**
 * DIY专题播放器挂件
 * videoId              // 视频容器id
 * vid                  // 视频id
 * pid                  // 专辑id
 * ark                  // 广告播放器
 * autoplay             // 是否自动播放
 * picStartUrl          // 播放开始的图片
 * isContinue           // 是否自动播放相同专辑下的视频
 *
 * 20160215 增加APP中试看调起登录功能
 */
define(function (require, exports, module) {
	'use strict';
	var CONSTANT = require('./constant.js');
	var events = require('../conference/events');
	var apph5Adapter = require('components/app/apph5Adapter');
	var VodPlayer = function () {};

	/**
	 * 原型定义
	 */
	VodPlayer.prototype = {
		constructor: VodPlayer,
		/**
		 * 组件初始化
		 */
		init: function (config) {
			this.initDom(config);
			this.initEvent();
			this.initPlayer();
			var _self = this;
			if (location.href.indexOf('editZtdiySubject') > -1) {
				setTimeout(function () {
					var width = 600 - _self.sideWidth;
					var height = 9 / 16 * width;
					$('#' + config.videoId).width(width).height(height);
				}, 3000);
			}
		},

		/**
		 * 初始化DOM和变量
		 */
		initDom: function (config) {
			this.config = config;
			this.sideWidth = config.sideWidth || 0;
		},

		/**
		 * 触发全屏
		 * @param isFullScreen
		 */
		onSetFullScreen: function (isFullScreen) {
			try {
				this.player.setFullScreen(isFullScreen);
			} catch (ex) {
				console.log(ex);
			}
		},

		/**
		 * 初始化事件
		 */
		initEvent: function () {
			$(window).off('ortchange', $.proxy(this.resizeFn, this));
			events.off('setFullScreen', $.proxy(this.onSetFullScreen, this));
			$(window).on('ortchange', $.proxy(this.resizeFn, this));
			events.on('setFullScreen', $.proxy(this.onSetFullScreen, this));
		},

		/**
		 * 转屏事件处理函数
		 */
		resizeFn: function () {
			var opt = this.config;
			var container = $('#' + opt.videoId),
				w = $('body').width() - this.sideWidth,
				h = 9 / 16 * w;
			container.height(h);
			container.width(w);
			if (this.player) {
				this.player.setSize(w, h);
			}
		},

		/**
		 * 初始化播放器
		 */
		initPlayer: function () {
			this.resizeFn();
			var opt = this.config;
			var playerEvent = {
				// 播放器初始化时
				onPlayerInit: function () {
					events.emit('playerInit');
				},
				// 视频首次起播
				onPlayerVideoPlay: function () {
					events.emit('playerVideoPlay');
				},
				// 视频暂停
				onPlayerVideoPause: function () {
					events.emit('playerVideoPause');
				},
				// 视频重新起播
				onPlayerVideoResume: function () {
					events.emit('playerVideoResume');
				},
				// 当前视频播放完毕。
				onPlayerVideoComplete: function () {
					events.emit('playerVideoComplete');
					var _status = opt.isContinue == '1' ? 'playerContinue' : 'recommend';
					return {status: _status};
				},
				// 准备起播下一集时。
				onPlayerPlayNext: function () {
					events.emit('playerPlayNext');
				},
				// 会员影片试看结束
				onDisplayTrylook: function () {
					events.emit('displayTrylook');
				}
			};
			opt.event = opt.event || {};
			var reg = /NetType\/WIFI/gi;
			var autoplay = reg.test(navigator.userAgent) ? '1' : '0';
			var videoParam = {
				containerId: opt.videoId,
				pname: 'MPlayer',
				mmDetect: 0,
				vid: opt.vid,
				pid: opt.pid,
				preload: 0,
				ark: opt.ark || '100',
				UIType: opt.UIType || 'min',
				typeFrom: opt.typeFrom || '',
				autoplay: autoplay,
				picStartUrl: opt.picStartUrl || '',
				autoReplay: opt.autoReplay || '0',
				event: $.extend(playerEvent, opt.event),
				interface: {
					openLoginDialog: function () {
						le.app.callLogin();
					}
				}
			};

			//是否是时移分享页 播放器添加时移操作
			if(opt.htime){
				videoParam.htime = opt.htime;
			}

			this.player = new LETV_PLAYER.Player(videoParam, CONSTANT.VIDEO_KEY);
		}
	};

	module.exports = VodPlayer;
});