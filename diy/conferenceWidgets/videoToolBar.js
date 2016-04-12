/**
 * M站播放器下边的工具条
 * **里边有这样几部分：
 * 1.乐视网的logo
 * 2.xxxx人正在观看，这里直播的时候显示，点播的时候隐藏
 * 3.收藏小星星（微信下才会出现，点击展示浮层指向微信右上角）
 * 4.分享按钮，点击下方浮现分享栏展示各种分享
 *
 */
define(function (require, exports, module) {
	'use strict';
	// 数字滚动组件
	var ScrollNum = require('../conference/scrollNum');
	var thousand = require('air/string/thousand');
	var ToolShare = require('diy/conference/toolShare');
	var events = require('../conference/events');
	// 微信收藏按钮组件
	var CollectButton = require('../conference/collectButton');
	var $ = Zepto;
	var VideoToolBar = function () {
	};
	VideoToolBar.prototype = {
		/**
		 * 组件初始化代码入口
		 * config 配置对象
		 *
		 * liveId:直播id，用于查询当前观看人数:http://n.api.live.letv.com/napi/onlineNumber/all/zhibo/liveId,
		 *
		 *
		 */
		init: function (config) {
			this.initDom(config);
			this.initEvent();
			this.initWidget(config);
		},

		/**
		 * 初始化工具条节点变量以及组件级变量
		 * config 配置对象
		 * numContDomId 数字组件容器id，“12,323人正在观看”；
		 * collectDomId 收藏按钮id
		 * shareDomId 分享按钮id
		 * liveId 直播id 必填
		 *
		 */
		initDom: function (config) {
			this.playNumCon = $('#' + config.numContDomId);
			this.config = config;
			this.liveId = config.liveId;
			this.markId = config.markId;
			this.isFirstRequest = true;
			this.currentNumber = 0;
			this.randomSetTimer = null;
			this.onlineScrollNum = null;
			this.requestError = false;
			this.startHideTips = config.startHideTips;
			/*******************新增总人数*********************/
			this.totalPlayNumCon = $('#' + config.totalNumContDomId);
			this.isTotalFirstRequest = true;
			this.totalOnlineScrollNum = null;
			this.totalRequestError = false;
			/*******************新增总人数*********************/
		},

		/**
		 * 初始化工具条中的事件
		 */
		initEvent: function () {
			events.on('scrollNumShouldStop', $.proxy(this.stopAllTimer, this));
			events.on('scrollNumShouldStart', $.proxy(this.initScroll, this));
		},

		/**
		 * 初始化几部分的功能
		 */
		initWidget: function () {
			this.initToolCollect();
			this.initToolShare();
		},

		/**
		 * 初始化滚动组件
		 */
		initScroll: function () {
			this.initScrollNum();
			this.initTotalScrollNum();
			this.initScrollTurn();
		},

		/**
		 * 初始化收藏
		 */
		initToolCollect: function(){
			var config = this.config;
			if (!config.collectDomId) {
				return;
			}
			var collectButton = new CollectButton();
			collectButton.init({
				domId: config.collectDomId,
				dataAp: 'ch=live&pg=diy&bk=toolshare&link=shareclick',
				codeAp: {
					code: 'collect',
					scode: 'tool'
				}
			});
		},

		/**
		 * 初始化工具条分享
		 */
		initToolShare: function () {
			var toolShare = new ToolShare();
			toolShare.init({
				widgetId: this.markId,
				startHideTips: this.startHideTips
			});
		},

		/**
		 * 观看人数功能初始化
		 */
		initScrollNum: function () {
			var _self = this;
			this._scrollNumRequest(this._scrollNumFormat);
			// 3分钟请求一次服务器数据
			this.onlineNumTimer = setInterval(function () {
				_self._scrollNumRequest(_self._scrollNumFormat);
			}, 180000);
		},

		/**
		 * 获取直播观看人数
		 */
		_scrollNumRequest: function (callback) {
			var _self = this;
			$.ajax({
				url: le.api_host.n_api_live + '/napi/onlineNumber/all/zhibo/' + this.liveId,
				dataType: 'jsonp',
				success: function (res) {
					if (isNaN(res.number)) {
						_self._scrollNumRequestError();
						return;
					}
					callback && callback.call(_self, res);
				},
				error: function () {
					_self._scrollNumRequestError();
				}
			});
		},

		/**
		 * 请求出错处理
		 */
		_scrollNumRequestError: function () {
			this.requestError = true;
			this.playNumCon.parents('.turn-num1').remove();
			events.emit('scrollNumRequestError');
			events.emit('scrollNumShouldStop');
		},

		/**
		 * 格式化
		 * @param res
		 * @private
		 */
		_scrollNumFormat: function(res){
			window.info = window.info || {};
			window.info.peopleOnLine = res.number;
			var formatedCount = thousand(res.number);
			if (this.isFirstRequest) {
				this.isFirstRequest = false;
				var scrollNum = this.onlineScrollNum = new ScrollNum();
				scrollNum.init({
					showNum: formatedCount,
					width: 7,
					height: 18,
					useRem: true
				});
				this.currentNumber = res.number;
				this.playNumCon.html(scrollNum.getNumDom());
				this.setRandom();
			} else {
				if (this.randomSetTimer) {
					clearInterval(this.randomSetTimer);
					this.randomSetTimer = null;
				}
				var isAdd = res.number > this.currentNumber;
				this.animationNum(formatedCount, isAdd);
				this.currentNumber = res.number;
				this.setRandom();
			}
		},

		/**
		 * 设置随机数
		 * -100到+100的随机数
		 */
		setRandom: function () {
			var _self = this;

			if (this.randomSetTimer) {
				clearInterval(this.randomSetTimer);
				this.randomSetTimer = null;
			}

			// 15s 中设置一次模拟数据 这个值可能增加 可能减少
			this.randomSetTimer = setInterval(function () {
				_self.doAnimate();
			}, 15000);
		},

		/**
		 * 执行动画
		 */
		doAnimate: function(){
			var isAdd = this.getRandomNum();
			var formatedNum = thousand(this.currentNumber);
			this.animationNum(formatedNum, isAdd);
		},

		/**
		 * 获取随机值并返回得到的随机数是否比之前的数大得布尔值
		 */
		getRandomNum: function () {
			var rand = Math.floor((Math.random() - 0.5) * 200);
			var tempNum = this.currentNumber;
			this.currentNumber = this.currentNumber + rand;
			// 当前值如果小于0那就让他等于100，因为直接等于0太假了，至少我自己还看着呢吧
			this.currentNumber = this.currentNumber < 0 ? 100 : this.currentNumber;
			window.info.peopleOnLine = this.currentNumber;
			var isAdd = this.currentNumber > tempNum;
			return isAdd;
		},

		/**
		 * 动画修改在线人数
		 * @param formatedCount string 需要格式化的在线人数
		 * @param isAdd boolean 是否为增加人数
		 */
		animationNum: function (formatedCount, isAdd) {
			var _self = this;
			if (_self.playNumCon.find('small').length !== formatedCount.length) {
				_self.onlineScrollNum.update(formatedCount);
				_self.playNumCon.html(_self.onlineScrollNum.getNumDom());
			} else {
				_self.onlineScrollNum.$animateDom = _self.playNumCon.find('small');
				_self.onlineScrollNum.animate(formatedCount, isAdd);
			}
		},

		/*************************Start新增总人数函数****************************/
		/**
		 * 初始化
		 */
		initTotalScrollNum: function () {
			var _self = this;
			this._totalScrollNumRequest(this._totalScrollNumFormat);
			// 3分钟请求一次服务器数据
			this.totalOnlineNumTimer = setInterval(function () {
				_self._totalScrollNumRequest(_self._totalScrollNumFormat);
			}, 180000);
		},

		/**
		 * 请求
		 * @private
		 */
		_totalScrollNumRequest: function (callback) {
			var _self = this;
			$.ajax({
				url: le.api_host.n_api_live + '/napi/uv/all/zhibo/' + this.liveId,
				dataType: 'jsonp',
				success: function (res) {
					if (isNaN(res.number)) {
						_self._totalScrollNumRequestError();
						return;
					}
					callback && callback.call(_self, res);
				},
				error: function () {
					_self._totalScrollNumRequestError();
				}
			});
		},

		/**
		 *
		 * @private
		 */
		_totalScrollNumRequestError: function () {
			this.totalRequestError = true;
			this.totalPlayNumCon.parents('.turn-num2').remove();
			events.emit('scrollNumRequestError');
		},

		/**
		 * 格式化
		 * @private
		 */
		_totalScrollNumFormat: function (res) {
			var formatedCount = this._totalFormatNum(res.number);
			if (this.isTotalFirstRequest) {
				this.isTotalFirstRequest = false;
				var scrollNum = this.totalOnlineScrollNum = new ScrollNum();
				scrollNum.init({
					showNum: formatedCount,
					width: 7,
					height: 18,
					useRem: true
				});
				this.totalPlayNumCon.html(scrollNum.getNumDom());
			} else {
				this.animationTotalNum(formatedCount, true);
			}
		},

		/**
		 * 格式化
		 * @private
		 */
		_totalFormatNum: function (count) {
			if (parseInt(count, 10) >= 0) {
				var formatedCount = '';
				if (count < 10000) {
					formatedCount = thousand(count);
				} else if (count < 100000000) {
					formatedCount = (count / 10000).toFixed(2) + '万';
				} else {
					formatedCount = (count / 100000000).toFixed(2) + '亿';
				}
				return formatedCount;
			} else {
				return '';
			}
		},

		/**
		 * 动画执行
		 */
		animationTotalNum: function (formatedCount, isAdd) {
			var _self = this;
			if (_self.totalPlayNumCon.find('small').length !== formatedCount.length) {
				_self.totalOnlineScrollNum.update(formatedCount);
				_self.totalPlayNumCon.html(_self.totalOnlineScrollNum.getNumDom());
			} else {
				_self.totalOnlineScrollNum.$animateDom = _self.totalPlayNumCon.find('small');
				_self.totalOnlineScrollNum.animate(formatedCount, isAdd);
			}
		},

		/**
		 * 增加轮换
		 */
		initScrollTurn: function () {
			var _self = this;
			setTimeout(function () {
				var playNumCon = _self.playNumCon.parents('.turn-num1');
				var totalPlayNum = _self.totalPlayNumCon.parents('.turn-num2');
				if (playNumCon.length === 0 || totalPlayNum.length === 0) {
					return;
				}
				_self.toggleScroll(playNumCon, totalPlayNum, 'ani_1');
				_self.scrollTurnTimer = setInterval(function () {
					_self.toggleScroll(playNumCon, totalPlayNum, 'ani_1');
				}, 10000);
			}, 2000);
		},

		/**
		 * 停止一切定时器，节省性能
		 */
		stopAllTimer: function () {
			window.clearInterval(this.onlineNumTimer);
			window.clearInterval(this.randomSetTimer);
			window.clearInterval(this.totalOnlineNumTimer);
			window.clearInterval(this.scrollTurnTimer);
			this.onlineNumTimer = null;
			this.randomSetTimer = null;
			this.totalOnlineNumTimer = null;
			this.scrollTurnTimer = null;
		},

		/**
		 * 切换
		 */
		toggleScroll: function ($dom1, $dom2, className) {
			if (this.totalRequestError || this.requestError) {
				return;
			}
			if ($dom1.hasClass(className)) {
				$dom1.removeClass(className);
				$dom2.addClass(className);
			} else {
				$dom2.removeClass(className);
				$dom1.addClass(className);
			}
		}
		/*************************End新增总人数函数****************************/
	};
	module.exports = VideoToolBar;
});



