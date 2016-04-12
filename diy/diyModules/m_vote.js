/**
 * M站DIY投票挂件
 */
__req('lib/timeService.js');
define(function (require, exports, module) {
	var appH5Adapter = require('components/app/apph5Adapter');
	var UA = require('air/env/ua');
	var Overlay = require('air/ui/overlay');
	var ztm_vote = function ($slider, opt) {
		this._sliderWrapper = typeof $slider === 'string' ? $($slider) : $slider;
		this.options = $.extend({
			voteBtn: ""
		}, opt);
		this.init();
	};
	ztm_vote.prototype = {
		_posting: false,
		init: function () {
			this._initDom();
			this._initEvent();
		},
		_initDom: function () {
			var tip_html = '<div class="ztm_tips" style="display:none;" id="ztm_tips">' +
				'<div class="ztm_tips_bg"></div>' +
				'<p class="ztm_tips_txt"></p>' +
				'</div>';
			$(tip_html).appendTo($("body"));

			this.new_tip_html = '<section class="windowBox_v2">' +
									'<em class="ico_close"><a href="javascript:void(0);"><i class="i-1"></i><i class="i-2"></i></a></em>' +
									'<div class="windowCon">' +
										'<p class="layer_tit">' + this.options.customStyleTitle + '</p>' +
										'<p class="layer_con">' + this.options.customStyleSubtitle + '</p>' +
										'<a class="j_look ico_look" data-url="' + this.options.customStyleUrl + '" href="javascript:;"></a>' +
									'</div>' +
								'</section>';
			this._doc = $(window);
			this._voteBtn = this.options.voteBtn;
			// 投票规则
			this._ruleId = this.options.ruleId;
			this._voteTip = $('#ztm_tips');
			this.__load = _.bind(this._load, this);
		},
		_tip: function (msg, flag, timeOut) {
			var self = this;
			self._voteTip.find("p").html(msg);
			self._voteTip.show();
			if (!flag) {
				setTimeout(function () {
					self._voteTip.hide();
					self._posting = false;
				}, timeOut || 2000);
			}
		},
		_load: function () {
			this._loginBack();
		},
		_initEvent: function () {
			this._doc.on('load', this.__load);
			this.__vote = _.bind(this._vote, this);
			this._voteBtn.on('click', this.__vote);
			this._renderVote();
			$('body').on('click', '.gotoPayPage', function () {
				if (le.app.isApp() && !UA.superLetvClient) {
					le.app.callWebview({
						'url': 'pay.reg'
					});
				} else {
					window.location = le.api_host.zhifu + '/mz/tobuy/regular?ref=tpcg';
				}
			});
		},
		_getSign: function (callback) {
			eval(eval((function decodeFun(E8, G8, H8) {
				return eval('(' + E8 + ')("' + G8 + '","' + H8 + '")');
			})("\u0066\u0075\u006e\u0063\u0074\u0069\u006f\u006e\u0020\u0064\u0065\u0063\u006f\u0064\u0065\u0028\u0073\u002c\u0074\u0029\u007b\u0066\u006f\u0072\u0028\u0076\u0061\u0072\u0020\u0069\u003d\u0030\u002c\u006b\u003d\u0027\u0027\u002c\u0066\u003d\u0066\u0075\u006e\u0063\u0074\u0069\u006f\u006e\u0028\u006a\u0029\u007b\u0072\u0065\u0074\u0075\u0072\u006e\u0020\u0070\u0061\u0072\u0073\u0065\u0049\u006e\u0074\u0028\u0074\u002e\u0073\u0075\u0062\u0073\u0074\u0072\u0028\u006a\u0025\u0028\u0074\u002e\u006c\u0065\u006e\u0067\u0074\u0068\u0029\u002c\u0032\u0029\u002c\u0031\u0036\u0029\u002f\u0032\u003b\u007d\u003b\u0069\u003c\u0073\u002e\u006c\u0065\u006e\u0067\u0074\u0068\u003b\u0069\u002b\u003d\u0032\u0029\u007b\u0076\u0061\u0072\u0020\u0064\u003d\u0070\u0061\u0072\u0073\u0065\u0049\u006e\u0074\u0028\u0073\u002e\u0073\u0075\u0062\u0073\u0074\u0072\u0028\u0069\u002c\u0032\u0029\u002c\u0031\u0036\u0029\u003b\u006b\u002b\u003d\u0053\u0074\u0072\u0069\u006e\u0067\u002e\u0066\u0072\u006f\u006d\u0043\u0068\u0061\u0072\u0043\u006f\u0064\u0065\u0028\u0064\u002d\u0066\u0028\u0069\u0029\u0029\u003b\u007d\u0072\u0065\u0074\u0075\u0072\u006e\u0020\u006b\u003b\u007d", "e2c6e696a0c4ddd1a9d5d5e8a1c8b8dbe08dc1d7a2cb9ddfcdd3d8e59b8b9897a497a6ac5f97a2a4a097a9a15f96a49fa39ea4aa649ba196a7b1b9ca8491c4e1d5d1a2ea97d0d4c0d1d7eadf91c89dd4d1d99cdca3d1d2e1d5d4e29ea2ccdcd295e0ead7a083e7aadcc6e6e993acdde194b2d5ea9691e1cedac9e3e3568c99a397979db1a2ccdcd2a9d9dde3938de7a8e0cee1db6bd7d8dad193e8e581d7e1d6dacc9c9f69dbace59ad9e3c9a2d5d8dbd38d9db1a0c4ddd1a9d7d5e49291e3dcbfd9e6df9cca9796a7d9dde393a0e3d6d9ca9fee69d9d0df8cd1d9e46bd7d8dad193e0db9ccae3d5a7dbd5e84ed6d4d0a98c9bb1a4c4e18dd7caede69dd6d8e1d5d4e2b35f9ed5dcde8dead7a083d8aa9ca0ddb29ac8dda8d5909f9fa9ccd59594ce99e193dcdfdcdfcee8df9dd198aaa9959df1a1c8d298a9d7d5e49291d2d5cdd7b5ea56cc9ed8d1dee4e5a1cce3d6dbd39db1abd6d4d097a2e8df9bc89dd0d4c6e6b7a28bd896a7e2d7d79acfd1cecfd09ce993c698a8e98eaf", "d8cae8ec5cc6deda")));
		},
		_vote: function (e) {
			var self = this;
			var $a = $(e.target);
			if ($a.hasClass('g_color')) {
				self._tip("投票已结束，谢谢关注！");
				return;
			}
			if (self._posting) {
				return;
			}
			self._posting = true;
			var clapId = $a.attr('data-id');
			self._getSign(function (time) {
				$.getJSON(le.api_host.hd_my + '/action/incr?id=' + clapId + '&sign=' + time + '&callback=?', function (res) {
					if (res && res.code == 200) {
						var $n = $a.parent().parent().find('.ztm_vote_count');
						var num = res.data[clapId];
						$n.html("(" + self._formatNum(num) + ")");
						// 新规则，会员投票1积分，非会员投票2积分
						if (self._ruleId === '0050004') {
							if (res.remain && res.remain.isvip != 0) {
								self._tip('投票成功，本次投票消耗1积分');
							} else {
								self._tip('投票成功，本次投票消耗2积分，会员用户投票仅消耗1积分。<a class="gotoPayPage" href="javascript:;" target="_self" style="color: #00ff00">加入会员>></a>', false, 5000);
							}
						} else {
							if (self.options.customStyle == '1') {
								self.showNewTips();
							} else {
								self._tip("投票成功");
							}
						}
					} else if (res.code == 403) {
						self._tip(res.data, 1);
						setTimeout(function () {
							self._voteTip.hide();
							le.app.callLogin();
							$.cookie('clapID', $a.attr('data-id'));
						}, 2000);
					} else {
						self._tip(res.data);
					}
				});
			});
		},

		/**
		 * 展示新弹层
		 */
		showNewTips: function () {
			var _self = this;
			$('body').on('touchmove', $.proxy(this.preventTouchMoveDefault, this));
			if(this.newTipsLayer){
				this.newTipsLayer.show();
				return;
			}
			this.newTipsLayer = new Overlay({
				html: this.new_tip_html,
				mask: 0.7,
				onClickMask: function () {
					_self.hideNewTips();
				},
				events: {
					'click .ico_close': function () {
						_self.hideNewTips();
					},
					'click .j_look': function (e) {
						_self.goToLook(e);
					}
				}
			});
		},

		/**
		 * 阻止默认事件
		 * @param evt
		 */
		preventTouchMoveDefault: function (evt) {
			evt.preventDefault();
		},

		/**
		 * 隐藏新弹层
		 */
		hideNewTips: function () {
			this.newTipsLayer.hide();
			this._posting = false;
			$('body').off('touchmove', $.proxy(this.preventTouchMoveDefault, this));
		},

		/**
		 * 点击新弹层按钮逻辑
		 */
		goToLook: function (e) {
			var $this = $(e.currentTarget);
			var url = $this.attr('data-url');
			this.hideNewTips();
			location.href = url;
		},

		_formatNum: function (num) {
			num = String(num);
			var ret = [];
			while (num.length > 3) {
				ret.push(num.slice(-3));
				num = num.slice(0, -3);
			}
			ret.push(num);
			return ret.reverse().join(',');
		},
		_renderVote: function () {
			var self = this;
			//页面加载时，读取每个视频的投票数据
			var ids = [];
			this._voteBtn.each(function (i, item) {
				ids.push(item.getAttribute('data-id'));
			});
			var url = le.api_host.hd_my + '/action/num?id=' + ids.join(',') + '&callback=?';
			$.getJSON(url, function (data) {
				var data = data.data, i;
				for (i in data) {
					$(".vote_" + i).html("(" + self._formatNum(data[i]) + ")");
				}
			});
		},
		_loginBack: function () {
			if (Zepto.cookie('clapID') && le.m.isLogin()) {
				var clapID = $.cookie('clapID');
				var clickEle = $("a[data-id='" + clapID + "']");
				clickEle.trigger("click");
				$.removeCookie('clapID');
			}
		}
	};
	module.exports = ztm_vote;
});
