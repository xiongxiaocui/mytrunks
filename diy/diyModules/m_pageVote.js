/**
 * M 站分页投票组件（新）
 * 翻页功能的投票组件
 * author：liwenliang@letv.com
 * http://zhifu.letv.com/mz/tobuy/regular?ref=tpcg
 */
define(function (require, exports, module) {
	// 页面用到了eval所以不适用use strict;
	var Tpl = require('air/util/tpl');
	var thousand = require('air/number/thousand');
	var appH5Adapter = require('components/app/apph5Adapter');
	var UA = require('air/env/ua');
	var Overlay = require('air/ui/overlay');
	var PageVote = function () {
	};
	PageVote.prototype = {
		_posting: false,
		/**
		 * 程序入口
		 * @param config
		 */
		init: function (config) {
			this.initDom(config);
			this.initEvent();
			this.initpage();
			this.pageID.trigger('click');
		},

		/**
		 * 初始化dom节点与变量
		 * @param config
		 */
		initDom: function (config) {
			this.config = config;
			this.$contain = $('#'+config.domId);
			this.contID = this.$contain.find('.ztm_voteCon');
			this.pageID = this.$contain.find('.ztm_page');
			this.widgetId = config.widgetId;
			this.pageSize = config.pageSize;
			this.showTitle = config.showTitle;
			this.voteImgUrl = config.voteImgUrl;
			this.grayClass = config.grayClass;
			this.ztdiyApi = config.ztdiyApi || le.api_host.static_api;
			this._ruleId = '';
			var tip_html = '<div class="ztm_tips" style="display:none;" id="ztm_tips' + config.widgetId + '">' +
								'<div class="ztm_tips_bg"></div>' +
								'<p class="ztm_tips_txt"></p>' +
							'</div>';
			$("body").append(tip_html);

			this.new_tip_html = '<section class="windowBox_v2">' +
									'<em class="ico_close"><a href="javascript:void(0);"><i class="i-1"></i><i class="i-2"></i></a></em>' +
									'<div class="windowCon">' +
										'<p class="layer_tit">' + config.customStyleTitle + '</p>' +
										'<p class="layer_con">' + config.customStyleSubtitle + '</p>' +
										'<a class="j_look ico_look" data-url="' + config.customStyleUrl + '" href="javascript:;"></a>' +
									'</div>' +
								'</section>';
			this._voteTip = $('#ztm_tips' + config.widgetId);
			this._doc = $(window);
			this.__load = _.bind(this._load, this);
		},

		_load: function () {
			this._loginBack();
		},

		_loginBack: function () {
			if (Zepto.cookie('clapID') && le.m.isLogin()) {
				var clapID = $.cookie('clapID');
				var clickEle = $("a[data-id='" + clapID + "']");
				clickEle.trigger("click");
				$.removeCookie('clapID');
			}
		},

		/**
		 * 初始化事件
		 */
		initEvent: function(){
			this.contID.on('click', '.ztm_vote_btn', $.proxy(this.doVote, this));
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

		/**
		 * 执行投票
		 */
		doVote: function(e){
			var _self = this;
			var $target = $(e.currentTarget);
			if ($target.hasClass('g_color')) {
				this._tip("投票已结束，谢谢关注！");
				return;
			}
			if (_self._posting) {
				return;
			}
			_self._posting = true;
			var optionId = $target.attr('data-id');
			this._getSign(function(time){
				$.getJSON(le.api_host.hd_my + '/action/incr?id=' + optionId + '&sign=' + time + '&callback=?', function (res) {
					if (res && res.code == 200) {
						var $voteCount = $target.parent().parent().find('.ztm_vote_count');
						var num = res.data[optionId];
						$voteCount.html('(' + thousand(num) + ')');
						// 新规则，会员投票1积分，非会员投票2积分
						if (_self._ruleId === '0050004') {
							if (res.remain && res.remain.isvip != 0) {
								_self._tip('投票成功，本次投票消耗1积分');
							} else {
								_self._tip('投票成功，本次投票消耗2积分，会员用户投票仅消耗1积分。<a class="gotoPayPage" href="javascript:;" target="_self" style="color: #00ff00">加入会员>></a>', false, 5000);
							}
						} else {
							if (_self.config.customStyle == '1') {
								_self.showNewTips();
							} else {
								_self._tip("投票成功");
							}
						}
					} else if (res.code == 403) {
						_self._tip(res.data, 1);
						setTimeout(function () {
							_self._voteTip.hide();
							le.app.callLogin();
							$.cookie('clapID', $target.attr('data-id'));
						}, 2000);
					} else {
						_self._tip(res.data);
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
			if (this.newTipsLayer) {
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

		/**
		 * 提示层
		 * @param msg
		 * @param flag
		 * @private
		 */
		_tip: function (msg, flag, timeOut) {
			var self = this;
			this._voteTip.find("p").html(msg);
			this._voteTip.show();
			if (!flag) {
				setTimeout(function () {
					self._voteTip.hide();
					self._posting = false;
				}, timeOut || 2000);
			}
		},

		/**
		 * 获取与服务端约定好的time值
		 * @param callback
		 * @private
		 */
		_getSign: function (callback) {
			eval(eval((function decodeFun(E8, G8, H8) {
				return eval('(' + E8 + ')("' + G8 + '","' + H8 + '")');
			})("\u0066\u0075\u006e\u0063\u0074\u0069\u006f\u006e\u0020\u0064\u0065\u0063\u006f\u0064\u0065\u0028\u0073\u002c\u0074\u0029\u007b\u0066\u006f\u0072\u0028\u0076\u0061\u0072\u0020\u0069\u003d\u0030\u002c\u006b\u003d\u0027\u0027\u002c\u0066\u003d\u0066\u0075\u006e\u0063\u0074\u0069\u006f\u006e\u0028\u006a\u0029\u007b\u0072\u0065\u0074\u0075\u0072\u006e\u0020\u0070\u0061\u0072\u0073\u0065\u0049\u006e\u0074\u0028\u0074\u002e\u0073\u0075\u0062\u0073\u0074\u0072\u0028\u006a\u0025\u0028\u0074\u002e\u006c\u0065\u006e\u0067\u0074\u0068\u0029\u002c\u0032\u0029\u002c\u0031\u0036\u0029\u002f\u0032\u003b\u007d\u003b\u0069\u003c\u0073\u002e\u006c\u0065\u006e\u0067\u0074\u0068\u003b\u0069\u002b\u003d\u0032\u0029\u007b\u0076\u0061\u0072\u0020\u0064\u003d\u0070\u0061\u0072\u0073\u0065\u0049\u006e\u0074\u0028\u0073\u002e\u0073\u0075\u0062\u0073\u0074\u0072\u0028\u0069\u002c\u0032\u0029\u002c\u0031\u0036\u0029\u003b\u006b\u002b\u003d\u0053\u0074\u0072\u0069\u006e\u0067\u002e\u0066\u0072\u006f\u006d\u0043\u0068\u0061\u0072\u0043\u006f\u0064\u0065\u0028\u0064\u002d\u0066\u0028\u0069\u0029\u0029\u003b\u007d\u0072\u0065\u0074\u0075\u0072\u006e\u0020\u006b\u003b\u007d", "e2c6e696a0c4ddd1a9d5d5e8a1c8b8dbe08dc1d7a2cb9ddfcdd3d8e59b8b9897a497a6ac5f97a2a4a097a9a15f96a49fa39ea4aa649ba196a7b1b9ca8491c4e1d5d1a2ea97d0d4c0d1d7eadf91c89dd4d1d99cdca3d1d2e1d5d4e29ea2ccdcd295e0ead7a083e7aadcc6e6e993acdde194b2d5ea9691e1cedac9e3e3568c99a397979db1a2ccdcd2a9d9dde3938de7a8e0cee1db6bd7d8dad193e8e581d7e1d6dacc9c9f69dbace59ad9e3c9a2d5d8dbd38d9db1a0c4ddd1a9d7d5e49291e3dcbfd9e6df9cca9796a7d9dde393a0e3d6d9ca9fee69d9d0df8cd1d9e46bd7d8dad193e0db9ccae3d5a7dbd5e84ed6d4d0a98c9bb1a4c4e18dd7caede69dd6d8e1d5d4e2b35f9ed5dcde8dead7a083d8aa9ca0ddb29ac8dda8d5909f9fa9ccd59594ce99e193dcdfdcdfcee8df9dd198aaa9959df1a1c8d298a9d7d5e49291d2d5cdd7b5ea56cc9ed8d1dee4e5a1cce3d6dbd39db1abd6d4d097a2e8df9bc89dd0d4c6e6b7a28bd896a7e2d7d79acfd1cecfd09ce993c698a8e98eaf", "d8cae8ec5cc6deda")));
		},

		/**
		 * 初始化页面结构
		 */
		initpage: function () {
			var scrollingLoader = require('air.util.scrollingLoader');
			var _self = this;
			var page = 1;
			var opt = {
				$loadBtn: _self.pageID,
				loadData: function () {
					// 通过totalNum计算总共多少页,totalNum一定是一次请求之后才有的，所以第一次一定会请求
					$.ajax({
						url: _self.ztdiyApi + '/ztdiy/getVoteOptions',
						type: 'get',
						dataType: 'jsonp',
						data: {
							widgetId: _self.widgetId,
							pageNo: page,
							pageSize: _self.pageSize
						},
						success: function (res) {
							if (res.code == 200) {
								_self.voteInfo = res.voteInfo;
								_self.totalNum = res.totalNum;
								_self.renderData(res.voteOptions);
							}
						}
					});
					page++;
					if (page > Math.ceil(_self.totalNum / _self.pageSize)) {
						_self.pageID.hide();
						return;
					}
				}
			};
			new scrollingLoader(opt);
		},

		/**
		 * 渲染数据
		 * @param data
		 * @returns {boolean}
		 */
		renderData: function(data){
			if (!data || data.length === 0) {
				this.pageID.hide();
				return false;
			}
			var len = data.length;
			var ids = [];
			var ruleId = this._ruleId = this.voteInfo.ruleId;
			var voteId = this.voteInfo.voteId;
			for (var i = 0; i < len; i++) {
				var optionId = ruleId + '_' + voteId + '_' + data[i].optId;
				ids.push(optionId);
			}
			this.getVoteCount(ids);

			if (len >= this.totalNum || len < this.pageSize) {
				this.pageID.hide();
			}
			var html = this.getTpl().render(data);
			this.contID.append(html);
			Zepto('img[data-url]').imglazyload();
		},

		/**
		 * 查找投票数并渲染到结构
		 * @param ids
		 */
		getVoteCount: function (ids) {
			$.ajax({
				url: le.api_host.hd_my + '/action/num',
				type: 'get',
				data: {
					id: ids.join(',')
				},
				dataType: 'jsonp',
				success: function (res) {
					if (res.code == 200) {
						var data = res.data;
						for (var item in data) {
							$('#vote_' + item).html("(" + thousand(data[item]) + ")");
						}
					}
				}
			});
		},

		/**
		 * 获取模板对象
		 * @returns {Tpl}
		 */
		getTpl: function () {
			var _self = this;
			var titleHtml = '';
			if (this.showTitle === 'true') {
				titleHtml = '<span class="a_cnt"><h3>{voteText}</h3><p>{voteSubText}</p></span>';
			}
			var html = '<div>' +
							'<a href="{voteHref}" class="vote_temp">' +
								'<span class="a_img">' +
									'<img src="'+ this.voteImgUrl +'" data-url="{voteImgSrc}"/>' +
									'<i></i>' +
								'</span>' +
								titleHtml +
							'</a>' +
							'<span class="voteBtnCon">' +
								'<a class="ztm_vote_btn ' + this.grayClass + '" data-id="{optionId}" href="javascript:;">投票</a>' +
							'</span>' +
							'<span id="vote_{optionId}" class="ztm_vote_count"></span>' +
						'</div>';
			var tpl = new Tpl(html, function (item) {
				item.optionId = _self.voteInfo.ruleId + '_' + _self.voteInfo.voteId + '_' + item.optId;
			});
			return tpl;
		}
	};
	module.exports = PageVote;
});