/**
 * M站直播播放器
 */
define(function (require, exports, module) {
	'use strict';
	var CONSTANT = require('./constant.js');
	var events = require('../conference/events');

	var LiveVideo = function () {
	};

	/**
	 * 定义组件原型
	 */
	LiveVideo.prototype = {
		constructor: LiveVideo,

		/**
		 * 程序初始化入口
		 * @param config
		 */
		init: function (config) {
			this.initDom(config);
			this.initEvent();
			this.initLiveVideo();
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
		 * 初始化结构与变量
		 */
		initDom: function (config) {
			this.config = $.extend({
				modelId: "html,body", //模块id
				videoId: "",          //渲染播放器的标签id
				ind: 0,               //默认第几个视频播放
				liveInfo: [{          //直播的信息
					cid: "",          //频道id
					ark: "100",       //广告播放器id
					rate: "",         //码流
					lid: "",          //直播id
					ch: "",           //统计渠道
					picStartUrl: "",  //poster图
					typeFrom: ""      //渠道号
				}],
				timeshift : ''
			}, config);
			this.$container = $('#' + config.videoId);
			this.livePlayer = null;
			this.sideWidth = config.sideWidth || 0;
		},

		/**
		 * 转屏处理函数
		 */
		resizeFn: function () {
			var $container = this.$container;
			var w = $('body').width() - this.sideWidth,
				h = 9 / 16 * w;
			$container.height(h);
			$container.width(w);
			if (this.livePlayer) {
				this.livePlayer.setSize(w, h);
			}
		},

		/**
		 * 触发全屏
		 * @param isFullScreen
		 */
		onSetFullScreen: function (isFullScreen) {
			try {
				this.livePlayer.setFullScreen(isFullScreen);
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
		 * 初始化直播播放器
		 */
		initLiveVideo: function () {
			this.resizeFn();
			var opt = this.config;
			var ind = opt.ind;
			// 如果直播信息未填，需要容错
			if (!opt || !opt.liveInfo || !opt.liveInfo[ind]) {
				return;
			}
			var playerEvent = {
				// 播放器初始化时
				onPlayerInit: function () {
					events.emit('playerInit');
				},

				//播放器出错
				onPlayerPlayError:function(){
					window.info.playerErr=1;//在info上加入播放失败标志
					window.setTimeout(function(){
						events.emit('stopBubbleChat');
						events.emit('stopRenderLiveChat');
					},300);
				}
			};
			var rateList = {
					350: 1,
					800: 2,
					1000: 2,
					1300: 3,
					1800: 4,
					3000: 5,
					6000: 5,
					1: 1,
					2: 2,
					3: 3,
					4: 4,
					5: 5
				};
			var _rate = rateList[opt.liveInfo[ind].rate] || 1;
			opt.event = opt.event || {};
			var reg = /NetType\/WIFI/gi;
			var autoplay = reg.test(navigator.userAgent) ? '1' : '0';
			var videoParam = {
				containerId: opt.videoId,
				pname: 'MPlayer',
				pid: opt.liveInfo[ind].pid,
				channelId: opt.liveInfo[ind].channelId,
				cid: opt.liveInfo[ind].cid,
				autoplay: autoplay,
				rate: _rate,
				preload: 0,
				UIType: opt.liveInfo[ind].UIType || 'min',
				ark: opt.liveInfo[ind].ark,
				picStartUrl: opt.liveInfo[ind].picStartUrl,
				typeFrom: opt.liveInfo[ind].typeFrom,
				ch: opt.liveInfo[ind].ch,
				autoReplay : 1,
				event: $.extend(playerEvent, opt.event)
			};


			if(opt.timeshift){
				videoParam.timeshift = opt.timeshift;
			}

			/**
			 * 初始化直播播放器
			 * @type {LETV_PLAYER.LivePlayer}
			 */
			this.livePlayer = new LETV_PLAYER.LivePlayer(videoParam, CONSTANT.VIDEO_KEY);
		}
	};
	module.exports = LiveVideo;
});
