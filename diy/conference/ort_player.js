/*
 ## DIY专题播放器屏幕适应逻辑
 ### 需求点
 android平台与ios平台旋转屏播放器自适应逻辑
 ### 技术点
 1. 通过js相关的转屏api保证旋转屏幕适配
 */

define(function (require, exports, module) {
	'use strict';
	var events = require('./events');
	var OrtPlayer = function(){

	};
	OrtPlayer.prototype = {
		_isAndroid: /Android/i.test(navigator.userAgent),
		_isIphone: /iphone/i.test(navigator.userAgent),
		_isWeixin: /micromessenger/i.test(navigator.userAgent),
		isFullScreen: false,
		init: function (options) {
			var _self = this;
			this.options = options || '';
			if (!options.videoWrapperId) {
				return;
			}
			events.on('playerInit', function () {
				_self._initDom();
				_self._initEvent();
				_self.initPage();
			});
		},

		/**
		 * 初始化DOM结构
		 * @private
		 */
		_initDom: function () {
			var options = this.options;
			this.offsetW = options.offsetW || 0;
			this._videoWrapper = $('#' + options.videoWrapperId);
			// 非全屏播放器容器宽度
			this.notFullScreenWidth = this._videoWrapper.width();
			// 横屏的时候退出全屏，宽度就不能是notFullScreenWidth了
			this.horizontalWidth = null;
			this.firstIsFullScreen = false;
			this.supportOrientation = (typeof window.orientation === 'number' && typeof window.onorientationchange === 'object');
			// 标记用户主动点击全屏
			this.customFullScreen = false;
		},

		/**
		 * 初始化事件
		 * @private
		 */
		_initEvent: function () {
			var self = this;
			if (this.supportOrientation) {
				$(window).on('ortchange', $.proxy(this.onOrtChange, this));
			} else {
				$(window).on('resize', $.proxy(this.onOrtChange, this));
			}
			// 监听全屏事件，再调播放器的设置全屏方法
			// isActiveBehavior为true表示点击全屏按钮触发
			events.on('playerChangeFullscreen', function (data) {
				if (data.isActiveBehavior) {
					self.changeFullScreen(data.flag);
					self.customFullScreen = !!data.flag;
				}
			});
			// 处理全屏情况下，浏览器尺寸发生变化调整播放器大小，优化体验效果
			$(window).on('resize', $.proxy(this.fullScreenResize, this));
		},

		/**
		 * 全屏情况下尺寸变化
		 * 比如超级手机下全屏拖动播放器，浏览器的导航栏
		 * 与底部会发生变化，这时候页面尺寸是有变化的，播放页
		 * 也要跟着变化
		 */
		fullScreenResize: function () {
			this.changeSize(this.isFullScreen);
		},

		/**
		 * 页面初始化
		 * 竖屏：不操作
		 * 横屏：调用全屏
		 */
		initPage: function () {
			if (this._isAndroid || this._isIphone) {
				if (this.getOrientation()) {
					this.firstIsFullScreen = true;
					this.changeFullScreen(true);
					events.emit('setFullScreen', true);
				}
			}
		},

		/**
		 * 旋转屏事件
		 */
		onOrtChange: function () {
			var isHorizontal = this.getOrientation();
			if (this.firstIsFullScreen) {
				if (!isHorizontal) {
					this.notFullScreenWidth = $('body').width() - this.offsetW;
				}
			}
			if (!this.customFullScreen) {
				this.changeFullScreen(isHorizontal);
				events.emit('setFullScreen', isHorizontal);
			}
			this.ortResize(isHorizontal);
		},

		/**
		 * isHorizontal true横屏调尺寸
		 * isHorizontal false竖屏调尺寸
		 */
		ortResize: function(isHorizontal){
			var width = this.notFullScreenWidth;
			var height = (9 / 16 * width);
			if (isHorizontal || this.customFullScreen) {
				width = $('body').width();
				height = $(window).height();
				this.horizontalWidth = $(window).width();
			}
			this._videoWrapper.width(width);
			this._videoWrapper.height(height);
		},

		/**
		 * 改变播放器尺寸
		 * @private
		 */
		changeSize: function (isFullScreen) {
			var width = this.getOrientation() ? this.horizontalWidth : this.notFullScreenWidth;
			var height = (9 / 16 * width);
			// 当前是横屏但是取横屏宽度为0的时候取body宽度
			if (isFullScreen || (this.getOrientation() && !this.horizontalWidth)) {
				width = $('body').width();
				height = $(window).height();
			}
			this._videoWrapper.width(width);
			this._videoWrapper.height(height);
		},

		/**
		 * 改变全屏状态
		 * @param flag  1为全屏 0为非全屏
		 */
		changeFullScreen: function (isFullScreen) {
			this.isFullScreen = isFullScreen;
			var body = $('body');
			if (this.isFullScreen) {
				body.addClass('fullScreen');
				events.emit('setOrtPlayerFullScreen');
			} else {
				body.removeClass('fullScreen');
				events.emit('offOrtPlayerFullScreen');
			}
			this.changeSize(isFullScreen);
		},

		/**
		 * 判断是否横屏
		 * @returns {boolean} true： 横屏 false：竖屏
		 */
		getOrientation: function () {
			var isH = false;
			if (this.supportOrientation) {
				isH = Math.abs(window.orientation) == 90;
			} else {
				isH = (window.innerWidth > window.innerHeight);
			}
			return isH;
		}
	};

	module.exports = OrtPlayer;
});
