/**
 * M站专题DIY倒计时组件功能代码
 * 逻辑：
 * 1.取服务器当前时间进行倒计时
 * 2.每隔1分钟重新取一次服务器时间（解决离开当前页面js停止执行，再回来倒计时不准的问题）
 */

define(function (require, exports, module) {
	'use strict';
	// 引入模板引擎
	var Tpl = require('air/util/tpl');
	var TimeService = require('comp/TimeService');
	var CountDown = function (opt) {
	};
	CountDown.prototype = {
		/**
		 * 倒计时组件初始化
		 */
		init: function (config) {
			this.initDom(config);
			this.initCountDown();
		},

		/**
		 * 初始化组件的变量与节点
		 */
		initDom: function (config) {
			if (!config.deadLine) {
				return;
			}
			this.config = config;
			this.deadLine = Date.parse(config.deadLine.replace(/-/g, '/')) / 1000;
			this.$contentDom = $('#'+config.domId);
			this.timer = null;
			this.serverTime = null;
			// 每隔60秒重新获取一次服务器时间
			this.reLoadServerTime = 60;
			this.counterFlag = 0;
		},

		/**
		 * 初始化组件
		 */
		initCountDown: function () {
			if (!this.deadLine) {
				return;
			}
			this.getServerTime();
		},

		/**
		 * 获取时间
		 */
		getServerTime: function () {
			var _self = this;
			TimeService.get(function (time) {
				_self.serverTime = Math.floor(time);
				_self.startTimer();
			}, 3000);
		},

		/**
		 * 开始倒计时
		 */
		startTimer: function () {
			var _self = this;
			if (this.timer) {
				clearInterval(this.timer);
				this.timer = null;
			}

			this.timer = setInterval(function () {
				_self.getServerTime();
				_self.setNewTimer();
			}, 1000);

			_self.setNewTimer();
		},

		/**
		 * 设置新的倒计时时间
		 *
		 **/
		setNewTimer: function () {
			var ts = this.deadLine - this.serverTime;//计算剩余的毫秒数
			var dd = parseInt(ts / 60 / 60 / 24, 10);//计算剩余的天数
			var hh = parseInt(ts / 60 / 60 % 24, 10);//计算剩余的小时数
			var mm = parseInt(ts / 60 % 60, 10);//计算剩余的分钟数
			var ss = parseInt(ts % 60, 10);//计算剩余的秒数
			var shouldStop = false;
			if (dd +hh + mm + ss <= 0 || isNaN(dd) || isNaN(hh) || isNaN(mm) || isNaN(ss)) {
				shouldStop = true;
			}
			dd = this.getTwoBit(dd);
			hh = this.getTwoBit(hh);
			mm = this.getTwoBit(mm);
			ss = this.getTwoBit(ss);
			var obj = {};
			obj.day = shouldStop ? '00' : dd;
			obj.hour = shouldStop ? '00' : hh;
			obj.minuit = shouldStop ? '00' : mm;
			obj.second = shouldStop ? '00' : ss;
			if (shouldStop) {
				clearInterval(this.timer);
				this.timer = null;
				if (this.config.onEnd) {
					this.config.onEnd();
				}
			}
			this.renderDom([obj]);
		},

		/**
		 * 开始渲染
		 */
		renderDom: function (obj) {
			var tplStr = '<ul class="boxFlex tiles">' +
								'{showTime}' +
							'</ul>' +
							'<ul class="boxFlex labels">' +
								'{showFormat}' +
							'</ul>';
			var tpl = new Tpl(tplStr, function (item, order) {
				var day = item.day;
				var hour = item.hour;
				var minuit = item.minuit;
				var second = item.second;
				if (day === '00') {
					item.showTime = '<li>' + hour + '</li><li>' + minuit + '</li><li>' + second + '</li>';
					item.showFormat = '<li>HRS</li><li>MINS</li><li>SECS</li>';
				} else {
					item.showTime = '<li>' + day + '</li><li>' + hour + '</li><li>' + minuit + '</li><li>' + second + '</li>';
					item.showFormat = '<li>DAYS</li><li>HRS</li><li>MINS</li><li>SECS</li>';
 				}
			});
			var result = tpl.render(obj);
			this.$contentDom.html(result);
			this.$contentDom.css('visibility','visible');
		},

		/**
		 * 补齐月，日数字位数
		 * @param {number|string} n 需要补齐的数字
		 * @return {string} 补齐两位后的字符
		 */
		getTwoBit: function (n) {
			return (n > 9 ? '' : '0') + n;
		}
	};
	module.exports = CountDown;
});