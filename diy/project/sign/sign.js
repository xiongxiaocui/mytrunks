/**
 * 签到逻辑组件
 * 逻辑：
 * 1.页面初始化的时候判断是否登录，如果登录则判断是否已经签到过，如果签到过则增加签到过的样式。
 * 2.如果没有签到样式
 *      未登录，首先登录
 *      登录成功以后判断是否已经签到过，签到过增加签到过的样式。
 *      登录后未签到过，可以走签到逻辑
 * 页面地址：http://m.letv.com/izt/zongyi_qyjs
 * Created by liwenliang on 11/3/15.
 */
define(function (require, exports, module) {
	'use strict';
	var apph5Adapter = require('components/app/apph5Adapter');
	var Overlay = require('air/ui/overlay');
	var Sign = function () {
	};
	/**
	 * 原型
	 */
	Sign.prototype = {
		/**
		 * 代码初始化
		 */
		init: function (config) {
			this.initDom(config);
			this.initEvent();
			this.initSign();
		},

		/**
		 * 初始化dom节点
		 */
		initDom: function (config) {
			this.$signDom = $('#' + config.domId);
			this.$signBtn = this.$signDom.find('.qd_btn');
			this.$signText = this.$signDom.find('.j_signText');
			this.$ruleBtn = this.$signDom.find('.gif_btn');
			this.$tipsBan = this.$signDom.find('.tips_ban');
			// 签到活动名称,签到接口会用到
			this.checkinName = 'qyjsyd';
			this.ruleLayer = null;
			this.layerText = config.layerText || '';
		},

		/**
		 * 初始化事件
		 */
		initEvent: function () {
			this.$signBtn.on('click', $.proxy(this.signBtnClick, this));
			this.$ruleBtn.on('click', $.proxy(this.showRule, this));
		},

		/**
		 * 展示浮层
		 */
		showRule: function () {
			if(this.ruleLayer){
				this.ruleLayer.show();
				return;
			}
			var htmlStr = '<div id="rule_box" class="layer_box">' +
								'<p class="left_grad"></p>' +
								'<p class="right_grad"></p>' +
								'<div class="close_btn"><a href="javascript:;"><img src="http://i2.letvimg.com/lc02_img/201511/02/18/42/1843/close_btn_03.png" width="18" height="18" /></a></div>' +
								'<div class="layer_img"><img src="http://i3.letvimg.com/lc02_img/201511/02/18/06/1803/img.png" width="249" height="104"/></div>' +
								'<div class="larer-txt">' + this.layerText + '</div>' +
								'<p class="top_grad"></p>' +
							'</div>';
			this.ruleLayer = new Overlay({
				html: htmlStr,
				mask: 0.7,
				onClickMask: function () {
					this.hide();
				},
				events: {
					'click .close_btn': function () {
						this.hide();
					}
				}
			});
		},

		/**
		 * 积分按钮点击事件
		 * @param ev
		 */
		signBtnClick: function () {
			var $target = this.$signBtn;
			if ($target.hasClass('signed')) {
				// 或者提示已签到
				return;
			}
			this.doAddExperience(this.alreadySigned);
		},

		/**
		 * 已经签到过的处理函数
		 */
		alreadySigned: function () {
			var $target = this.$signBtn;
			var $tipsban = this.$tipsBan;
			var $signText = this.$signText;
			$target.addClass('signed').html('已签到');
			$tipsban.addClass('yiqian');
			$signText.html('您今日已获得');
		},

		/**
		 * 增加积分
		 * wiki地址：http://wiki.letv.cn/pages/viewpage.action?pageId=45290662
		 */
		doAddExperience: function (callback) {
			var loged = this.checkLogin();
			if (!loged) {
				return;
			}
			var _self = this;
			$.ajax({
				url: le.api_host.hd_my + '/checkin/checkinAddJf',
				type: 'get',
				dataType: 'jsonp',
				data: {
					activity: 'qysign',
					checkinName: _self.checkinName
				},
				success: function (res) {
					if (res.code === 200) {
						callback.call(_self);
					}
				}
			});
		},

		/**
		 * 检查是否登录，未登录跳转登录页
		 */
		checkLogin: function () {
			if (le.m.isLogin()) {
				return true;
			} else {
				setTimeout(function () {
					le.app.callLogin();
				}, 2000);
				return false;
			}
		},

		/**
		 * 区分是否已经签到过
		 */
		tellIfSigned: function (callback) {
			var _self = this;
			$.ajax({
				url: le.api_host.hd_my + '/checkin/getCheckin',
				type: 'get',
				dataType: 'jsonp',
				data: {
					checkinName: _self.checkinName
				},
				success: function (res) {
					if (res.code === 200) {
						callback.call(_self);
					}
				}
			});
		},

		/**
		 * 签到组件初始化
		 * 逻辑：
		 * 1.如果未登录，则不进行任何操作。
		 * 2.如果登录，需要判断是否已经签到，如果签到设置样式。
		 */
		initSign: function () {
			if (!le.m.isLogin()) {
				return;
			} else {
				this.tellIfSigned(this.alreadySigned);
			}
		}
	};
	module.exports = Sign;
});
