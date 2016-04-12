/**
 * Created by liwenliang on 10/19/15.
 * 组件规则：
 * 1. 显示：投票标题、两个投票选项、投票结果。同意用户可多次投票、可参与多个投票。
 * 2. 投票数显示规则：
 * ①万以下，显示具体数字。
 * ②万以上，亿以下，显示“X.X——XXXX.X万”，保留小数点后一位
 * ③亿以上，显示“X.X亿”保留小数点后一位。
 * 3. 用户参与投票后，投票有动画效果反馈。请动画同学设计。（用户参与投票后，有小拳头对抗的动画效果，图标变为选中态，允许用户对多个互动投票。用户离开页面重新进入，允许对之前内容重新投票。）
 * 4. 本场直播的所有投票都显示在该Tab下。按照时间倒序显示，最新发布的投票显示在上面。
 * 5. 直播过程中可能会出现新的互动内容。
 * 6. 投票标题可折行显示，全部显示编辑填写内容。
 */

define(function (require,exports,module) {
	var Tpl = require('air/util/tpl');
	var Url = require('air/util/Url');
	var thousand = require('air/string/thousand');
	var Broadcast = require('air/event/Broadcast');
	var TimeService = require('comp/TimeService');
	var ScrollNum = require('../scrollNum');
	var InterfaceErrorTip = require('components/interfaceErrorTip');
	var events = require('../events');
	var InteractTab = {
		/******************程序初始化代码Start******************/
		/**
		 * 逻辑入口
		 */
		init: function (config) {
			this.initDom(config);
			this.initEvent();
			// 如果当前正处于激活状态，需要走直接初始化
			if (config.widgetId && $('#interactWrap_' + config.widgetId).hasClass('active')) {
				this.initInteract();
			}
		},

		/**
		 * DOM节点及变量初始化入口
		 */
		initDom: function (config) {
			this.liveId = config.liveId;
			this.voteListData = [];
			this.$interactTabCon = $('.j-tab-interact'); // 这是互动区容器的类名
			this.optionIds = [];
			this.voteCountData = null;
			// 投票列表id
			this.currentVoteIds = [];
			// 投过票的id
			this.votedVoteIds = [];
			// 当前点击的投票列表项
			this.currentClickedItem = null;
			this.currentClickedSide = null;
			this.interactTimer = null;
			this.scrollNumObj = {};
			this.getVoteListSuccess = false;
			this.loadingTpl = $('<div class="loadBox"><div class="loader">Loading...</div></div>');
			this.initLoadingPage();
		},

		/**
		 * 事件初始化入口
		 */
		initEvent: function () {
			Broadcast.on('getVoteListDone', $.proxy(this.getVoteListDone, this));
			Broadcast.on('getVoteListDFailed', $.proxy(this.getVoteListDFailed, this));
			Broadcast.on('getVoteCountDone', $.proxy(this.getVoteCountDone, this));
			this.$interactTabCon.on('click', '.btn_1,.btn_2,.vote_lef_cnt,.vote_rig_cnt', $.proxy(this.itemClicked, this));
			events.on('requestInteract', $.proxy(this.refreshInteract, this));
		},

		/**
		 * "交互"Tab初始化入口
		 * 10秒钟更新一次投票数量
		 */
		initInteract: function () {
			var _self = this;
			// 获取列表
			this.getVoteList(this.liveId, function (data) {
				_self.voteListData = data.reverse();
				for (var i = 0; i < data.length; i++) {
					_self.currentVoteIds.push(data[i].vote_id);
				}
				Broadcast.emit('getVoteListDone');
			}, function () {
				Broadcast.emit('getVoteListDFailed');
			});

			// 3分钟更新一次列表
			this.interactTimer = setInterval(function () {
				_self.updateVoteList();
			}, 180000);
		},
		/******************程序初始化代码End******************/


		/******************事件定义Start******************/
		/**
		 * 获取投票列表成功处理函数
		 */
		getVoteListDone: function () {
			this.getOptionIds(this.voteListData);
			this.getVoteCoundList(this.optionIds, function () {
				Broadcast.emit('getVoteCountDone');
			});
			this.getVoteListSuccess = true;
		},

		/**
		 * 获取投票列表失败处理函数
		 */
		getVoteListDFailed: function () {
			this.loadingTpl.hide();
			if (this.interfaceErrorTip) {
				this.interfaceErrorTip.showTip();
			} else {
				this.interfaceErrorTip = new InterfaceErrorTip();
				this.interfaceErrorTip.init({
					container: this.$interactTabCon,
					callback: $.proxy(this.refreshInteract, this)
				});
			}
		},

		/**
		 * loading加载样式
		 */
		initLoadingPage: function () {
			this.$interactTabCon.html(this.loadingTpl);
		},

		/**
		 * 获取投票数完成
		 */
		getVoteCountDone: function () {
			var html = this.getTplStr(this.voteListData);
			this.$interactTabCon.html(html);
			this.setRateSize();
		},

		/**
		 * 点击小旗后行为
		 * 投过票以后就不能再投了，除非刷新页面
		 * 代码有待优化
		 */
		itemClicked: function (e) {
			var $this = $(e.currentTarget);
			var optionId = $this.attr('data-id');
			var voteItemId = $this.attr('data-voteid');
			this.currentClickedSide = $this.attr('data-side');

			// 选项点击统计
			setTimeout(function () {
				Stats.sendAction({
					ap: 'ch=live&pg=diy&bk=interactTab&link=voteclick',
					vid: voteItemId || '-',
					targeturl: optionId || '-'
				});
			}, 0);
			// 每条互动的点击统计
			Stats.feStat({code: 'hudong'});

			var voted = false;
			for (var i = 0; i < this.votedVoteIds.length; i++) {
				if (voteItemId == this.votedVoteIds[i]) {
					voted = true;
				}
			}
			if (voted) {
				return;
			}
			this.currentClickedItem = $this.parents('.vote_box');
			var $voteLeft = this.currentClickedItem.find('.vote_lef');
			var $voteRight = this.currentClickedItem.find('.vote_rig');
			if (this.currentClickedSide === 'left') {
				this.currentClickedItem.addClass('active');
			} else if (this.currentClickedSide === 'right') {
				this.currentClickedItem.addClass('active1');
			}
			$voteLeft.find('b').addClass('act1');
			$voteLeft.find('i').addClass('act3');
			$voteRight.find('b').addClass('act1');
			$voteRight.find('i').addClass('act3');
			this.addVoteCount(optionId);
			this.votedVoteIds.push(voteItemId);
		},

		/**
		 * 刷新整个交互列表
		 */
		refreshInteract: function () {
			this.loadingTpl.show();
			if (this.getVoteListSuccess) {
				return;
			}
			clearInterval(this.interactTimer);
			this.initInteract();
		},
		/******************事件定义End******************/

		/******************公共逻辑代码Start******************/
		/**
		 * 格式化投票列表数据成我们需要的数据格式
		 */
		getOptionIds: function (voteListData) {
			this.optionIds = [];
			for (var i = 0; i < voteListData.length; i++) {
				if (voteListData[i].options.length !== 2) {
					continue;
				}
				this.optionIds.push(voteListData[i].options[0].option_id);
				this.optionIds.push(voteListData[i].options[1].option_id);
			}
		},

		/**
		 * 格式化投票数：
		 * ①万以下显示具体数字
		 * ②万以上，亿以下，显示“ X.X- XXXX.X 万”，保留小数点后1位
		 * ③亿以上显示“ X.X 亿”，保留小数点后1位
		 *
		 * @param count 投票数 整数
		 */
		formatRateCount: function (count) {
			if (parseInt(count, 10) >= 0) {
				var formatedCount = '';
				if (count < 10000) {
					formatedCount = thousand(count);
				} else if (count < 100000000) {
					formatedCount = (count / 10000).toFixed(1) + '万';
				} else {
					formatedCount = (count / 100000000).toFixed(1) + '亿';
				}
				return formatedCount;
			} else {
				return '';
			}
		},

		/**
		 * 更新投票数
		 */
		updateVoteCount: function (optionIds, updateRateSize) {
			var _self = this;
			this.getVoteCoundList(optionIds, function (res) {
				if (res.code != '200') {
					return;
				}
				_self.updateVoteItemCount(res.data, false);
				if (updateRateSize) {
					_self.setRateSize();
				}
			});
		},

		/**
		 * 返回互动区html结构
		 * @returns {*}
		 */
		getTplStr: function (renderData) {
			var _self = this;
			var tplStr =
				'<div class="vote_box">' +
                    '<div class="vote_tit">{title}</div>' +
                    '<div class="progress vote_lef" data-votecount="{js_voteCount_one_full}">'+
	                    '<span class="btn_1" data-side="left" data-voteid="{vote_id}" data-id="{optionId_one}"></span>'+
	                    '<b></b>'+
	                    '<i></i>'+
                    '</div>'+
                    '<div class="progress vote_rig" data-votecount="{js_voteCount_two_full}">'+
	                    '<span class="btn_2" data-side="right" data-voteid="{vote_id}" data-id="{optionId_two}"></span>'+
	                    '<b></b>'+
	                    '<i></i>'+
                    '</div>'+
                    '<ul class="vote_lef_cnt" data-side="left" data-voteid="{vote_id}" data-id="{optionId_one}">'+
						'<li>{optionTitle_one}</li>' +
                        '<li id="vote_{optionId_one}" data-side="left">{js_voteCount_one}</li>'+
                    '</ul>'+
                    '<ul class="vote_rig_cnt" data-side="right" data-voteid="{vote_id}" data-id="{optionId_two}">'+
						'<li>{optionTitle_two}</li>' +
                        '<li id="vote_{optionId_two}" data-side="right">{js_voteCount_two}</li>'+
                    '</ul>'+
                '</div>';
			var renderTpl = new Tpl(tplStr, function (item) {
				var opIdOne = item.options[0].option_id;
				var opIdTwo = item.options[1].option_id;

				var voteCountOne = _self.voteCountData[opIdOne];
				var voteCountTwo = _self.voteCountData[opIdTwo];
				item.optionId_one = opIdOne;
				item.optionId_two = opIdTwo;
				item.optionTitle_one = item.options[0].title;
				item.optionTitle_two = item.options[1].title;
				item.js_voteCount_one_full = voteCountOne;
				item.js_voteCount_two_full = voteCountTwo;

				var oneName = 'vote_' + opIdOne;
				_self.scrollNumObj[oneName] = new ScrollNum();
				_self.scrollNumObj[oneName].init({
					showNum: _self.formatRateCount(voteCountOne),
					width: 12,
					unitWidth: 23,
					height: 25
				});
				item.js_voteCount_one = _self.scrollNumObj[oneName].getNumDom();

				var twoName = 'vote_' + opIdTwo;
				_self.scrollNumObj[twoName] = new ScrollNum();
				_self.scrollNumObj[twoName].init({
					showNum: _self.formatRateCount(voteCountTwo),
					width: 12,
					unitWidth: 23,
					height: 25
				});
				item.js_voteCount_two = _self.scrollNumObj[twoName].getNumDom();
			});
			return renderTpl.render(renderData);
		},

		/**
		 * 更新投票数
		 * 如果是点击的话，直接在当前票数基础上加1，获取投票数的接口做了假数据
		 * @param voteCounts
		 */
		updateVoteItemCount: function (voteCounts, singleUpdate, fromClick) {
			for (var item in voteCounts) {
				if (voteCounts.hasOwnProperty(item)) {
					var count = voteCounts[item];
					if (fromClick) {
						count = parseInt(this.voteCountData[item], 10) + 1;
					}
					this.updateVoteCountDom('vote_' + item, count, singleUpdate);
				}
			}
		},

		/**
		 * 修改投票数
		 * @param optionId
		 * @param count
		 */
		updateVoteCountDom: function (optionId, count, singleUpdate) {
			var $targetDom = $('#'+optionId);
			var newCount = this.formatRateCount(count);
			if (newCount === $targetDom.html()) {
				return;
			}
			if ($targetDom.find('small').length != newCount.length) {
				this.scrollNumObj[optionId].update(newCount);
				$targetDom.html(this.scrollNumObj[optionId].getNumDom());
			} else {
				this.scrollNumObj[optionId].$animateDom = $targetDom.find('small');
				this.scrollNumObj[optionId].animate(newCount, true);
			}

			if (singleUpdate) {
				var currentSide = this.currentClickedSide;
				var currentDom = this.currentClickedItem;
				if (currentSide === 'left') {
					currentDom.find('.vote_lef').attr('data-votecount', count);

				} else if (currentSide === 'right') {
					currentDom.find('.vote_rig').attr('data-votecount', count);
				}
			} else {
				var side = $targetDom.attr('data-side');
				var $parentDom = $targetDom.parents('.vote_box');
				if (side === 'left') {
					$parentDom.find('.vote_lef').attr('data-votecount', count);
				} else if (side === 'right') {
					$parentDom.find('.vote_rig').attr('data-votecount', count);
				}
			}
		},

		/**
		 * 更新投票列表
		 */
		updateVoteList: function () {
			var _self = this;
			this.getVoteList(this.liveId, function (data) {
				_self.voteListData = data.reverse();
				var currentVoteIds = _self.currentVoteIds;
				var readyRenderData = [];
				for (var i = 0; i < data.length; i++) {
					var exist = false;
					for (var j = 0; j < currentVoteIds.length; j++) {
						if (currentVoteIds[j] == data[i].vote_id) {
							exist = true;
						}
					}
					if (!exist) {
						currentVoteIds.push(data[i].vote_id);
						readyRenderData.push(data[i]);
					}
				}
				_self.getOptionIds(_self.voteListData);
				var html = _self.getTplStr(readyRenderData);
				_self.$interactTabCon.prepend(html);
				_self.updateVoteCount(_self.optionIds, true);
			});
		},

		/**
		 * 更新两边长度
		 */
		setRateSize: function ($voteListDoms) {
			var $tabCon = this.$interactTabCon;
			var voteListDoms = $voteListDoms || $tabCon.find('.vote_box');
			for (var i = 0; i < voteListDoms.length; i++) {
				var currentListDom = voteListDoms.eq(i);
				var lefDom = currentListDom.find('.vote_lef');
				var rigDom = currentListDom.find('.vote_rig');
				var lefCon = currentListDom.find('.vote_lef_cnt');
				var rigCon = currentListDom.find('.vote_rig_cnt');
				var leftCount = parseInt(lefDom.attr('data-votecount'), 10);
				var rightCount = parseInt(rigDom.attr('data-votecount'), 10);
				if (leftCount === 0 && rightCount === 0) {
					continue;
				}

				var totalCount = leftCount + rightCount;
				var leftRate = this.optimizeRate(leftCount / totalCount * 100);
				var rightRate = this.optimizeRate(rightCount / totalCount * 100);

				lefDom.css('width', leftRate);
				lefCon.css('width', leftRate);
				rigDom.css('width', rightRate);
				rigCon.css('width', rightRate);
			}
		},

		/**
		 * 优化百分比数值
		 * 大于65%就显示65%，小于35%就显示35%
		 */
		optimizeRate: function (rate) {
			if (rate > 65) {
				rate = 65;
			} else if (rate < 35) {
				rate = 35;
			}
			return rate + '%';
		},
		/******************公共逻辑代码End******************/


		/******************投票相关接口Start******************/

		/**
		 * 获取投票列表
		 * wiki：http://wiki.letv.cn/pages/viewpage.action?pageId=48631031
		 * 这里虽然要求传vid，但是可以传直播id来获取，只要编辑在后台的投票部分填写的是直播id即可。
		 * @param liveId    直播id
		 */
		getVoteList: function (liveId, callback, errorCallback) {
			var _self = this;
			$.ajax({
				url: le.api_host.hd_my + '/action/video',
				type: 'get',
				data: {
					vid: liveId,
					type: 5
				},
				dataType: 'jsonp',
				success: function (res) {
					if (res.code == '200' && res.data.length !== 0) {
						callback && callback.call(_self, res.data);
					} else {
						errorCallback && errorCallback.call(_self);
					}
				},
				error: function(){
					errorCallback && errorCallback.call(_self);
				}
			});
		},

		/**
		 * 获取投票数列表
		 */
		getVoteCoundList: function (optionIds, callback) {
			var _self = this;
			$.ajax({
				url: le.api_host.hd_my + '/action/num',
				type: 'get',
				data: {
					id: optionIds.join(',')
				},
				dataType: 'jsonp',
				success: function (res) {
					if (res.code == '200') {
						_self.voteCountData = res.data;
						callback && callback.call(_self, res);
					}
				}
			});
		},

		/**
		 * 增加投票数
		 * 增加投票成功以后，如果格式化后的投票数发生了变化，则进行动画渐隐渐现的效果
		 * @param optionId 选项ID
		 */
		addVoteCount: function (optionId) {
			var _self = this;
			TimeService.update(function (time) {
				$.ajax({
					url: le.api_host.hd_my + '/action/incr',
					type: 'get',
					data: {
						id: optionId,
						sign: _self.getSign(time)
					},
					dataType: 'jsonp',
					success: function (res) {
						if (res.code!= '200'){
							return;
						}
						_self.updateVoteItemCount(res.data, true, true);
						_self.setRateSize(_self.currentClickedItem);
					}
				});
			});
		},

		/**
		 * 获取签名
		 * @param time0
		 * @returns {*}
		 * @private
		 */
		getSign: function (time0) {
			eval(eval((function (h8, P2, I8) {
				return eval('(' + h8 + ')("' + P2 + '","' + I8 + '")');
			})("\u0066\u0075\u006e\u0063\u0074\u0069\u006f\u006e\u0028\u0073\u002c\u0074\u0029\u007b\u0066\u006f\u0072\u0028\u0076\u0061\u0072\u0020\u0069\u003d\u0030\u002c\u006b\u003d\u0027\u0027\u002c\u0066\u003d\u0066\u0075\u006e\u0063\u0074\u0069\u006f\u006e\u0028\u006a\u0029\u007b\u0072\u0065\u0074\u0075\u0072\u006e\u0020\u0070\u0061\u0072\u0073\u0065\u0049\u006e\u0074\u0028\u0074\u002e\u0073\u0075\u0062\u0073\u0074\u0072\u0028\u006a\u0025\u0028\u0074\u002e\u006c\u0065\u006e\u0067\u0074\u0068\u0029\u002c\u0032\u0029\u002c\u0031\u0036\u0029\u002f\u0032\u003b\u007d\u003b\u0069\u003c\u0073\u002e\u006c\u0065\u006e\u0067\u0074\u0068\u003b\u0069\u002b\u003d\u0032\u0029\u007b\u0076\u0061\u0072\u0020\u0064\u003d\u0070\u0061\u0072\u0073\u0065\u0049\u006e\u0074\u0028\u0073\u002e\u0073\u0075\u0062\u0073\u0074\u0072\u0028\u0069\u002c\u0032\u0029\u002c\u0031\u0036\u0029\u003b\u006b\u002b\u003d\u0053\u0074\u0072\u0069\u006e\u0067\u002e\u0066\u0072\u006f\u006d\u0043\u0068\u0061\u0072\u0043\u006f\u0064\u0065\u0028\u0064\u002d\u0066\u0028\u0069\u0029\u0029\u003b\u007d\u0072\u0065\u0074\u0075\u0072\u006e\u0020\u006b\u003b\u007d", "ded5df8c8f95cea29cdca3d1d2e1d1e3db945edae2c6e6967999ac95a1aa9b986d969a9eb9a7579fac9598a2a4b1678b9cdda7ad57a2979de0a5a0986d909a9cada9739598a790aba29a6193a08eb29e5edba4a294a69f9a6d98b1979db566949da79faba99d658da5aaa6b5569ca69b9ca7b29d618fe496d8dc9197a7a6a0d69ed09688a695ecaa659f979de0a9a09865d7a2969db565969d9e9badb29765999e96a2ab6694b49f94e49fa95dc5e1d3d7ea97d2dd95dba599bf6988e7dbd5e84ea7a2aa8a9699dc6a9c949ea9a46696a3b299a09fa16395b1979db25694a79b98a5b297678b9cdda9d957a2979de0a6a39869919a97a7bb618ca995a0ac999cad92a48eb2b35697a39998eca1a45e9e9496aca25edba3d091ae95a06a8da098b9a95a9898a990a6a59865d7a1959db55694a29b99a7a0b1678bd2c6e0e9938ca99598ec9ecd618fe497ac9f69ccd595dba59bd89acdd3d9dcb45693e7a09aa0a4a56393b1969db26b8ba19b9bb99e9865d79f979db55695a299a0aa9b9e6e96b1969db05696a29b94ab9d9a6b97a3aaa49f6a8ba1a696a69fa57a8f9895eca85e8cae9598eca2a26194a393adbb599498a790a4e5a1678b9cdda9aa579fa2a296a5a29d7a91ab95ecd9688b9fe598a09de466c195a19ca6a697a3999ca296ab5d93a493a6bb608f9fe59da996a665d7a1999ddc9dd597e3c9e68dd96b9c9497a7a464a8a09998ec9ecd5e9d9495ecab668fa39e96a7a2a27a8f95a4aaa96893e79f9cb2a49c6390a49bb9a76d93e79f9eae959d668d9899a5a457a1979de0a69f9865d79fc69db55edba3a5a2a69f9a6a97b197b2b356939da1ad9f9f9866909a8eb39e5edba49d94a4e5d05e99949ca7a4669cb49f94a4e5d05e9ba59ea2a85f9cb4a0a79ca2a16391b197a0a86091a59da0b99e956f87a29aa2a25f949da49aacb29d5e9da09aa2ac61a8a0ac90ad9d9a6ba49c91a4ee5f9c98a798eca09c70cca2a3a5b157a7a298a59cdda172cfa1a49ca76191a1b29ba09ea06396b1959db4569ca49b94a4e59e6588ab8da9a95a94a696a29ca19e6394a1aaa5a2629a98aba59ca2a56394a4aaa7a25edba59f91b3959cad969895eca8618ca995a0ad9ba17a909897a2aa739598ab90a5a29868929a9ca6a7738ea196a7a4e59d65999496a5a25f9398ab98eca2a174879cdddaa2649c98a790a9a09a6aa49e91a4ee619898aba59ca29c6391a198b9a75a9aa19b91b395a3678b9cdda7ae579d979de0a9a09865d79e989db4569ba29b9db99f986b989a9aabbb618cae9598eca2d061959d939db05693e7a0caa0a5a17a8a9f8eb2b35697a89b9bb99e9869939a9ea5bb5f8caed3c9e0e0d16f879cddaaa2639498a990a4e59d998b9cdda8d957a2a4a696aca1b16799949da5a4679ab49899a0a1a56394b1989db05693e79e9aa09de469c195a1b1a76491a09f99b99dab6a929a9da7bb619d979e98a2a3b1688ba48eb2b361969da09fa7b29c7487a593a0a76191a7a0ad9f9f956f879cddaaa95a93e7a1ce9dab9e6e8d9d9bb9a76d8b9fe599a599a16e8da39eacbb608ca99598eca39d618fe498d89f6c8b9fe59cda999e688da49dabbb5f8cae9598ec9e9c618fe49ad69f6893e7a0cab2aa9465d7a19ba0a6a69698acdce6e2d16f8fe496a5b26b8ba49ba1b9989c618fe49aac9f6d8b9fe59bd699a2678da599b9a8579d979e98a2a4b1688ba197a2aa67a8a096a6b1959e6d8d989baca457a297a39ea2a2b1678b9cdda8d9579da19b98a7b29e5e9edf96a2d996c4e1aedc9cdaa25e998ea5999f93cce3d4919ce1b0accd8e93d7de8fd5b0e190e1a3996288a7d7d9eaa3d5dd8dbba8aaa972cde1d1e0b593d9d0d990b8a0956fb2a0c3e7a7ab8c978fc7ad95d989c49a8ed9d74ec8978f949ca69d63949daa9fa65a93e79f9f9dab946b939898a8a4659bb49e91b3959f6a8d9c96b9a85a9c9f9b91ae9de4989ba98da6a65a9ca49b91b3959cad939f91e2eb9acf98a7a1a2a69e66a49ca19ca6a698a39998eca0cd5e9e9499aaa46599b49e94aca69a68a49e8eaea76291a0a29eb9989d739c9495eca7678f9fe59ad696ab5d909f93a0ad6091a8a1a0b9989d5e999495eca9938fa69f96a99fb16688aaa29ca96091a0a4ada6999cad93a58eb39e62969da2ad9f9e9865d79f9a9db05698a1999fab969570d1d1d9e9e89cdebaa5a2dae2da98d3d5d4e29e9a9698e8ded5df8ca99598bda6b35699a19b98a9a3b1678ba0959db26b8b9fe59bab99a5688d95a4a4ee5e9d9fe59ca4a9a95d8fe4c6a0a6a694d396a79ca59f6390b195a0a6a694a396a29ca4a0638b9cdda8a757a1ac9598eca09f61919a96b9a857a2979de0a79f9865d7a09e9db056959da09cb99f986b979a96b9a857a1979de0a5d39865d7a1999db56794a99598ec9fa2618fe4979db26b8ba2a496a4a6a57a909895ecaa608caea596a5b29d6f87a19ea2a763a8a099a1a69ba26ea497989da29994acb89eb2dd9e61b6a3a0dae5a08baac59ab0d99f63cbd1d3dbea969e98e8bfabaa94a5c0ded8d9bf9cd797d99ba2d0d496d1add99cce608c9b959da69b9f7a8f989ba4a46794a8b293a696a872879cddd5a25edba49e91b3959cad909f91a4ee938ca99598eca1cd61959e939db2569a9d999ea59ba07a9295a4a4ee5f93a9959da69ba268a49d91adaa579f97a19da09de4689395a4a4ee63c5a9959ba79b9d7a929896a4bb608cabaa90aa9d9a6ba49f91a4ee60c498ac90a4e59d988b9f9da2a7609cb49e91ae959cad91a191aca75c95a5a5ada796aa7287a099a2ac60a8a19998ec9ea05e9e9d9ca2a967a8a1a798ec9f955e8de0d4c7eaa0ccddd4909c9de469c19895eca957a1aca09ab3959cad93d091a9a65c94a4b293a796a65d8fe499aaa25f989da19cb99e957387a399a2a7738ea1999eac9b9574879f9ca2a873959b9de0a696a65d96a493a9ad73939b9de0a79e9573939ca49ca8668f9fe59dd996a66a939aa3b1ac5ca2979de0aa9d986b939a95a9bb599598a790a7a49a6da49d91a4ee668cab95a1ad9ba466a49c91a4ee619b98ac90a4e59d6d8ba29ea2ad5e9ab49e91ae95a07a8a9d91a4ee5f939896a3e8a3a98d919790b1b35693e7a09ea09de466c095a1b1a6a6c6aea59faea3a2639da995ecaa8fa2a29f96aea59f7387a298a2aa738ea19998eca39c5e9e949ab9a85a9ca39b91ae95a56b8d989aa4a460a89a9d91b2aa9d678da5aaa6b55695a29b9bb9989e6197a593a9bb599398a7a1ac9ba56796b197b0b35f949da59aa5b29e74919c9faba66a93e7a0a0b39ea2638fa3aaa5b05693e7d094a4e59c5e9ec39ca2d996c4e1aedc9cc4a363cbd1d3dbea969097a19da2a29d6ba49f91a4ee918cadaa9dad9bab5d93a291a4ee649698a790a6a59a6ca49d91a4ee619798a9a5a4e59d679e9cdda8ab689ba69ba6b19de46693ab95eca7688ba49d96a6a4a47a8f989aa79f579de3a3c6cba49a98c7cdd7b5ea56baa69bd4d9dbd3a9c7998dabac5c99a3a3ada6999cad91ce8eb29e629c9d9eada6999e6a8d9c9dabbb608caea49aa2a7946c949a99a5a873959ba3969dab94698f9a99aabb618fa6a6969daca46c8d9d98b9a15e9d979de0a6a49866a497979db26b8b9fe59bd6999cad939e8eb39e5edba09f94a6a39a6ea49e8eae9e5edba4d194aca29a6695b1979db45699a29b94a9a19574879cddaba25edba096a2aa9ba16993b190a69fabd5d4e1dde6db8ca995ab86dfa768cea0eae5f196945e9ae2c6e6969d99e5aae3d3a7d2aacdcfd9dde59c8bdc99ae9de8de9ad3e1d7e2969ba0acb3e5a0d4a69bd4dac8e8df9dd197da94ba96e7a7c4e0dae6e44ed0abb3e5a0b2a69bd4dac8e8df9dd197da94ba96e7a7c4e0dae6e44ed0adb3e5a0bfa69bd4dac8e8df9dd197da94ba96e7a7c4e0dae6e44ed0adabaef199e06fc5e1d3d7ea97d2dd95d5a0b395b0d1d1d9e9e89c83dc8ea5b1b3e961d4a6cbe9e491d7d8dcd69cda987b88e7d7d9eaa3d5dd8dd5d2b3e961c2a6cbe9e491d7d8dcd69cda987b88e7d7d9eaa3d5dd8dd59ab3e961c3a6cbe9e491d7d8dcd69cda987b88e7d7d9eaa3d5dd8dd5b1aaa97bdc98ddaedca3d1d2e1d1e3db94a28bb28eefe893d7e4dfd694daa871a5e991d6b094d8ddd0dcdddcda5dcc98ab9df1a0c8e3e2dae28dd9569cb2e2a0e668c9e4dbcbe8d6dba387d991ba9fa9d5d4e1dde6db8ca284b2e2a0c968c9e4dbcbe8d6dba387d991ba9fa9d5d4e1dde6db8ca28cb2e2a0cd68c9e4dbcbe8d6dba387d991ba9fa9d5d4e1dde6db8ca2dbb2e2f1b194d8ddd0dcdddcda55d2d5cce29ea28ceae3c9e68dcb669cc69bd6a4799b978f98d58f957481b187ae98a0c4ddd1d7e18f989491a987e8e581d7e1d6d6db8f989492a987e0db9ccae3d58aa0cca072818e91d3ab6b85b48f94d3a3a957be8e91d3ad6b85d2d5c9e6aee0579ae2c6e696a0a0dfcedae7d2b5a3d3949baca46098b49fa4b19de4699e9cdda5d7688b9fe59dd6999cad92a58eb2b35698a69b94a6a29a66a49f8eb39e5f959da19bb99d9865d79d959db05edba0a0a69c9de46b919897a6a4659ca2b29a9dac9465d7a19ba0a95f91a5a3ada596a65d8fe499ada2669a9da198abb29e5e9ba98d96d5508f9fe59ca696ab5d81b187a0a7678ca99598eca29c618fe49ad59f6c8ba0a396a8a4a17a90989ba8a463a89aa091b3a5a46399a298b2b356989da6ada699a46c8d9d9aa5bb618cae959dab9b986895959f9ca6a699a0999da69b9f6e96b1989db26b8ba09f96aba6a17a91989ba7a46794b49e91b39de46699949aa8a2659b9da6ada596a872959d93a5a77393ae9e9ca2a0b167999495eca85a93e79e91b09de46992ab8da4ee609b9b9de0a5a09e6c91a5cad6dc5f8ca99de0a99fa86a979aa4ada46893e79e98b2aa9469939a98aaa973959b9de0a6d0957487a19ca2a660a8a19998ec9fd15e999495ecab8f8f9fe599a7969682c0e0cdcfd55fc0979693a6a09a6a93a3aaa5b26b93e79e9eb39de46698a68da8aa5c94a2b29aa09de468c495a39ca6a694d0999eac9ba56d97b1979db5649aa99de0a5a0aa72879e9ea2a662a89a9d94a7a4957487a599a2a25edba49e91ae95a06ea49e91a4ee619598a990a4e59c61929d8eb39e63939d9f9cb99e9867909a9aa7ad739498a790ac9f9a6aa49d91aca4649ab49e91b0aa946b979a91a4ee5f9398ac90a79d9a6a929faaa6a2649a9da5ada596a65d92a593a4ae738ea1999aaa9ba07a9195a1b19e5edba1d394a7a29a65959daaa49f6d8ba29d96adb29c618fe49ba49f688ba79f94ada39a6893b190a69f6aa097a396a09de4689695a49ca6a6989b9de0a796a667989a9cb9a76a8b9fe59aa09de4669595a49ca6a696a49998ecd3956f989c93aaab738ea2a9a5a69b9c6d92b190a6b566999da099b99fa665d79d9db2b35693e7a194a4e5d05e9e9495ecab638f9fe59ba6a3a168969dc6d59f688b9fe599d7999cadc595a3b1a962a2979de0a599a06c8da19ab9a7579d979e9da2a3a57a929898aba460a89f9691a0dba9a5c0ded8d9bf9cd797e191a0cea9a5c0ded8d9bf9cd797a392c1cee09dbacb96d19e578ea196a3e297a9968bdaa2e2d18d95cc9591a0cea996bacb97d19e578fe1aadacfcc9e92879591e2a16bc4aad3d7e695e296d18cd4b1e489c2a2ca94d9aacb698bd3a2a5a296a09fa8d7aae3c79494c98de3a2968caad5939f96db6bd5c7c4aad356cb94d494a496925b87d190b1e889c2a6ca90dc9cd35e8898ca9fb39cbecea4c59cd59570d1d1d9e9e89c83d4ea", "d0e8dad86abed8cae8ec5cc6deda")));
			return sign(time0);
		}

		/******************投票相关接口End******************/
	};
	module.exports = InteractTab;
});