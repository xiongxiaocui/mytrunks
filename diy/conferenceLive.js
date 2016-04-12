/**
 * diy发布会直播页面级挂件
 */

define(function (require, exports, module) {
	'use strict';
	var Url = require('air/util/Url');
	var events = require('./conference/events');
	// 倒计时组件
	var CountDown = require('./conference/countDown');
	// 分享按钮组件
	var ShareButton = require('./conference/shareButton');
	// 微信收藏按钮组件
	var CollectButton = require('./conference/collectButton');
	// 点播播放器组件
	var VodPlayer = require('./diyModules/vodPlayer');
	// 直播播放器
	var LivePlayer = require('./diyModules/livePlayer');
	// 视频下方工具条组件
	var VideoToolBar = require('./conferenceWidgets/videoToolBar');
	// 图文直播组件
	var PicTextLive = require('./conference/picTextLive');
	//时移顶部tip
	var ShiftPageTopTip = require('./conference/shiftPageTopTip');
	// 边买边看逻辑
	var BuyingLook = require('./conference/buyingLooking');
	// 全屏旋转屏
	var OrtPlayer = require('./conference/ort_player');
	//解说弹幕
	var commentary = require('./conference/chat/commentary');

	//播放器下方固定导流位
	//var FixGotoApp = require('./conference/gotoapp');

	// 倒流位 未开始倒计时下方与直播中上方
	var liveDaoliu = require('./conference/liveDaoLiu');

	//获取时移时间
	var Shift = require('./conference/getShiftTime');

	var Tpl = require('air/util/tpl');

	var conferenceLive = {
		/**
		 * 初始化
		 * @param config
		 */
		init: function (config) {
			this.initDom(config);
			this.initEvent();
			this.initPage();
		},

		/**
		 * 初始化节点与变量
		 * @param config
		 */
		initDom: function (config) {
			var _self = this;
			this.config = config;
			window.info = window.info || {};
			this.liveStatus = window.info.liveStatus = config.liveStatus;
			window.info.liveId = config.liveId;
			this.camerasList = config.cameras || [];
			if (this.camerasList.length > 0) {
				this.startHideTips = true;
			}
			this.toolPicLiveInited = false;
			// 直播状态当前正在直播的id
			this.currentPlayerLiveId = null;
			this.playerEvents = {
				// 切换全屏状态 fullscreenObj.flag fullscreenObj.isActiveBehavior
				onChangeFullscreen: function (eventName, fullscreenObj) {
					events.emit('playerChangeFullscreen', fullscreenObj);
					return 'custom';
				}
			};
			// 不能重复初始化的节点
			this.donotRepeatDom = [];
			// 判断当前环境
			if (navigator.userAgent.match(/MicroMessenger/i) != null) {
				this.isInWeiXin = true;
			}
			// M站编辑页和预览页无需动态请求接口的这个逻辑
			var localHref = location.href;
			if (localHref.indexOf('editZtdiySubject') > -1) {
				return;
			}
			this.getLiveStatus(config.markId);
			// 一分钟请求一次接口获取最新组件的状态，需要保存挂件发布专题才能生效
			setInterval(function () {
				_self.getLiveStatus(config.markId);
			}, 15000);
		},

		/**
		 * 事件监听
		 * 购物车
		 * 未登录的跳转地址：
		 * http://www.lemall.com/cart.html?alys_id=letv&user_id=0&deviceid=【deviceid】
		 * 备注：deivceid需要由访问购物车的WEB站点给出，可以是sessionid或其他uuid
		 * 已登录的跳转地址：
		 * http://www.lemall.com/cart.html?alys_id=letv&user_id=【uid】&deviceid=0
		 * 备注：【uid】一定要由触发URL事件带入
		 */
		initEvent: function () {
			var config = this.config;
			if (config.leMallLink) {
				$('#toolBarMallBtn' + config.markId).on('click', function () {
					if (!window.info.cartCount) {
						window.location = config.leMallLink;
					} else {
						var redirectUrl = 'http://m.lemall.com/carts/index.html?uuid=' + Stats.getLC();
						// 点击上报
						Stats.sendAction({
							acode: '0',
							lid: config.liveId,
							ap: 'ch=live&pg=diy&bk=lemall&link=click'
						}, redirectUrl);
					}
				});
			}
			// 存在边买边看并且bmbkBlockId不为空的时候进行初始化
			if (config.bmbk === '1' && config.bmbkBlockId) {
				if(location.href.indexOf('editZtdiySubject') > -1){
					return;
				}
				BuyingLook.init({
					widgetId: config.markId,
					liveId : config.liveId,
					startTime: config.liveBeginTime,
					bmbkBlockId: config.bmbkBlockId
				});
			}
			events.on('scrollNumRequestError', $.proxy(this.hideOnlineNum, this));
		},

		/**
		 * 初始化页面组件
		 */
		initPage: function () {
			var config = this.config;

			ShiftPageTopTip.init({
				widgetId : config.markId
			});
			switch (this.liveStatus) {
				case '1':
				case '11':
					this.initReadyBegin(config);
					break;
				case '2':
				case '3':
					this.initBegining(config);
					break;
				case '4':
					this.initEndProcessEnd(config);
					break;
				default :
					this.initNoBegin(config);
					break;
			}
			//播放器下方固定导流位
			// if(this.liveStatus !== '0'){
			// 	FixGotoApp.init({
			// 		'liveId': config.liveId,
			// 		'widgetId': config.markId
			// 	});
			// }
			// 特殊处理：移除分享按钮和返回顶部按钮
			$('#j-btn-showhide').remove();
		},

		/**
		 * 初始化未开始状态组件
		 * 未开始组件：
		 * 1.倒计时
		 * 2.分享按钮
		 * 3.收藏按钮
		 */
		initNoBegin: function () {
			var _self = this;
			var config = this.config;
			var markId = config.markId;
			$('#noBegin' + markId).show();
			// 倒计时
			this.prepareCountDownWidget({
				domId: 'noBeginCountDown' + markId,
				deadLine: config.liveBeginTime,
				onEnd: function () {
					_self.getLiveStatus(config.markId);
				}
			});

			// 分享按钮
			this.prepareShareButton({
				domId: 'noBeginShareBtn' + markId,
				dataAp: 'ch=live&pg=diy&bk=notstart&link=shareclick',
				codeAp: {
					code: 'share-btn',
					scode: 'wait'
				}
			});

			// 收藏按钮组件
			this.prepareCollectButtonWidget({
				domId: 'noBeginCollectBtn' + markId,
				dataAp: 'ch=live&pg=diy&bk=notstart&link=collectclick',
				codeAp: {
					code: 'collect',
					scode: 'wait'
				}
			});
		},

		/**
		 * 初始化即将开始状态组件
		 * 即将开始组件：
		 * 1.倒计时
		 * 2.分享
		 * 3.点拨播放器
		 * 4.工具条：数字滚动组件，收藏组件，分享组件
		 * 5.直播互动组件
		 */
		initReadyBegin: function (config) {
			var _self = this;
			var markId = config.markId;
			$('#readyBegin' + markId).show();
			// 倒计时
			this.prepareCountDownWidget({
				domId: 'readyBeginCountDown' + markId,
				deadLine: config.liveBeginTime,
				onEnd: function () {
					_self.getLiveStatus(config.markId);
				}
			});

			// 分享按钮
			this.prepareShareButton({
				domId: 'readyBeginShareBtn' + markId,
				dataAp: 'ch=live&pg=diy&bk=prestart&link=shareclick',
				codeAp: {
					code: 'share-btn',
					scode: 'ready'
				}
			});

			// 新增导流位
			liveDaoliu.init(config);

			if (this.liveStatus === '11') {
				var paramObj = Url.parseParam(window.location.href);
				// 直播播放器轮播
				this.prepareLivePlayer({
					sideWidth: 60,
					videoId: "readyBeginVodPlayer" + markId,
					liveInfo: [
						{
							channelId: config.lunboId,
							picStartUrl: config.startImg,
							UIType: 'min',
							ark: config.ad,
							ch : paramObj.ch
						}
					],
					event: this.playerEvents
				});
			} else {
				// 点拨播放器
				this.prepareVodPlayer({
					sideWidth: 60,
					videoId: 'readyBeginVodPlayer' + markId,
					vid: config.vid,
					pid: config.albumId,
					ark: config.ad,
					UIType: 'min',
					picStartUrl: config.startImg,
					event: this.playerEvents
				});
			}

			//初始化播放器下方工具条与图文直播挂件
			this.initToolAndPicLive({
				markId : markId,
				liveId : config.liveId,
				liveTitle : config.liveTitle,
				eventDesc : config.eventDesc,
				relationPids: config.relationPids,
				orignConfig: config
			});
		},

		/**
		 * 初始化直播中组件
		 * 1.直播播放器
		 * 2.工具条
		 * 3.图文直播
		 */
		initBegining: function (config) {
			var markId = config.markId;
			$('#begining' + markId).show();

			// 转码中状态显示时移按钮
			if (this.liveStatus === '3') {
				//转码中
				$('#liveShift' + markId).show();
			}

			// 执行初始化
			this.doInitLivePlayer(config.liveId);

			// 增加可切换直播流按钮
			this.addSwitchLiveIdBtn();

			// 增加多机位按钮逻辑
			this.addCamerasSwitchBtn();

			//初始化播放器下方工具条与图文直播挂件
			this.initToolAndPicLive({
				markId : markId,
				liveId : config.liveId,
				liveTitle : config.liveTitle,
				eventDesc : config.eventDesc,
				relationPids: config.relationPids,
				orignConfig: config
			});

			// 只有直播中才有在线人数
			if (this.liveStatus === '2') {
				this.showOnlineNum(markId);
			}

			// 新增导流位
			liveDaoliu.init(config);

			//解说弹幕
			commentary.init(config);
		},

		/**
		 * 初始化直播结束转码完成组件
		 */
		initEndProcessEnd: function (config) {
			var that = this;
			var markId = config.markId;
			$('#begining' + markId).show();
			
			var vodPlayerParams = {
				videoId: 'beginingLivePlayer' + markId,
				vid: config.vid,
				pid: config.albumId,
				ark: config.ad,
				UIType: 'min',
				picStartUrl: config.startImg,
				event: this.playerEvents
			};
			
			// 点播播放器
			Shift.getTimes({
				liveBeginTime : config.liveBeginTime,
				success : function(time){
					if(time){
						vodPlayerParams.htime = time;
						events.emit('showShiftLayer');
					}
					that.prepareVodPlayer(vodPlayerParams);
				}
			});

			//初始化播放器下方工具条与图文直播挂件
			this.initToolAndPicLive({
				markId : markId,
				liveId : config.liveId,
				liveTitle : config.liveTitle,
				eventDesc : config.eventDesc,
				relationPids: config.relationPids,
				orignConfig: config
			});
		},

		/**
		 * 初始化播放器下方工具条与图文直播挂件
		 */
		initToolAndPicLive: function (opt) {
			$('.startReady' + opt.markId).show();
			if (this.toolPicLiveInited) {
				return;
			}

			var startHideTips = this.startHideTips;

			// 工具条
			this.prepareVideoToolBar({
				markId: opt.markId,
				liveId: opt.liveId,
				numContDomId: 'toolBarScrollNum' + opt.markId,
				totalNumContDomId: 'toolBarTotalScrollNum' + opt.markId,
				collectDomId: 'toolBarCollectBtn' + opt.markId,
				shareDomId: 'toolBarShareBtn' + opt.markId,
				startHideTips: startHideTips
			});

			// 图文直播
			this.preparePicTextLive({
				widgetId: opt.markId,
				liveId: opt.liveId,
				liveTitle : opt.liveTitle,
				eventDesc : opt.eventDesc,
				relationPids: opt.relationPids,
				orignConfig: opt.orignConfig
			});

			this.toolPicLiveInited = true;
		},

		/**
		 * 准备倒计时组件
		 * options:
		 * domId: 倒计时节点
		 * deadLine: 终点时间
		 */
		prepareCountDownWidget: function (options) {
			if (!this.addToDonotRepeatDom(options.domId)) {
				return;
			}
			var countDown = new CountDown();
			countDown.init(options);
		},

		/**
		 * 准备分享按钮组件
		 * options.domId 分享按钮节点id
		 * options.shareInfo 分享信息，没有分享信息则取页面window.info.share
		 */
		prepareShareButton: function (options) {
			if (!this.addToDonotRepeatDom(options.domId)) {
				return;
			}
			var shareBtn = new ShareButton();
			shareBtn.init(options);
		},

		/**
		 * 准备收藏按钮组件
		 * options.domId 收藏按钮节点id
		 */
		prepareCollectButtonWidget: function (options) {
			if (!this.addToDonotRepeatDom(options.domId)) {
				return;
			}
			var collectButton = new CollectButton();
			collectButton.init(options);
		},

		/**
		 * 添加到不可重复的节点数组中
		 * @param domId 节点id
		 * return true添加成功 false添加过了
		 */
		addToDonotRepeatDom: function (domId) {
			var donotRepeatDom = this.donotRepeatDom;
			for (var i = 0; i < donotRepeatDom.length; i++) {
				if (domId === donotRepeatDom[i]) {
					return false;
				}
			}
			donotRepeatDom.push(domId);
			return true;
		},

		/**
		 * 准备播放器组件
		 * @param options
		 * 逻辑：
		 * 微信下wifi自动播放
		 * 非微信下不自动播放
		 *
		 */
		prepareVodPlayer: function(options){
			var vodPlayer = new VodPlayer();
			vodPlayer.init(options);
			// 点播播放器暴露在info下
			window.info.vodPlayer = vodPlayer;
			if (!this.addToDonotRepeatDom(options.videoId)) {
				return;
			}
			// 旋转屏实例
			var ortPlayer = new OrtPlayer();
			ortPlayer.init({
				videoWrapperId: options.videoId,
				offsetW: options.sideWidth || 0
			});
		},

		/**
		 * 直播播放器组件
		 * @param option
		 */
		prepareLivePlayer: function (option) {
			var livePlayer = new LivePlayer();
			livePlayer.init(option);
			// 直播播放器暴露在info下
			window.info.livePlayer = livePlayer;
			if (!this.addToDonotRepeatDom(option.videoId)) {
				return;
			}
			// 旋转屏实例
			var ortPlayer = new OrtPlayer();
			ortPlayer.init({
				videoWrapperId: option.videoId,
				offsetW: option.sideWidth || 0
			});
		},

		/**
		 * 播放器下方工具条组件
		 * @param options
		 */
		prepareVideoToolBar: function(options){
			var videoToolBar = new VideoToolBar();
			if (window.info.liveStatus !== '1' && window.info.liveStatus !== '11') {
				options.collectDomId = null;
			}
			videoToolBar.init(options);
		},

		/**
		 * 图文直播组件
		 * @param options
		 */
		preparePicTextLive: function(options){
			var picTextLive = new PicTextLive();
			picTextLive.init(options);
		},

		/**
		 * 获取直播状态
		 * 在测试环境想看到直播状态的话，需要绑定host： 10.154.252.56	static.api.letv.com
		 * @param widgetId
		 */
		getLiveStatus: function (widgetId) {
			var _self = this;
			$.ajax({
				url: le.api_host.static_api + '/ztdiy/queryLiveStatus',
				cache: false,
				type: 'get',
				dataType: 'jsonp',
				data: {
					widgetId: widgetId
				},
				success: function (res) {
					if (res.code == 200) {
						var newConfig = res.livepage;
						var liveStatus = newConfig.liveStatus;
						var shouldHideTab = newConfig.chatRoomTab === '0';
						if (_self.liveStatus !== liveStatus) {
							_self.liveStatus = liveStatus;
							// 将liveStatus暴露在info对象上，其他组件能够直接取到
							window.info.liveStatus = liveStatus;
							_self.needChange(liveStatus, newConfig);
						}
						if(shouldHideTab){
							_self.hideChatTab();
						}
					}
				}
			});
		},

		/**
		 * 隐藏聊天室
		 */
		hideChatTab: function () {
			var config = this.config;
			var markId = config.markId;
			events.emit('stopBubbleChat');
			events.emit('stopRenderLiveChat');
			// 如果隐藏聊天室的瞬间正好定位在聊天室，需要取第一个tab进行定位
			// 防止出现空白内容的效果
			if ($('#chatToomTab_' + markId).hasClass('active')) {
				$('#tabNav_' + markId).find('li').eq(0).find('a').trigger('click');
			}
			$('#chatToomTab_' + markId).hide();
			$('#chatRoomWrap_' + markId).hide();
			$('#j-bubble-chat-' + markId).hide();
			$('#j-bubble-wrapper-' + markId).hide();
			$('#j-chatInputBox').hide();
		},

		/**
		 * 需要无刷新动态修改页面显示状态（直播状态改变的时候触发）
		 * @param currentLiveStatus 当前直播状态（1，2，3，4）
		 * 直播状态的变化只能是
		 * 0——1（未开始到即将开始）   隐藏未开始状态的节点
		 * 1——2（即将开始到直播中）   隐藏即将开始，展示直播中的节点
		 * 2——3（直播中到转码中）    与上一个一样
		 * 3——4（转码中到转码结束）   直播播放器变成点播播放器
		 *
		 */
		needChange: function (currentLiveStatus, newConfig) {
			var config = this.config;
			$.extend(config, newConfig);
			var markId = config.markId;
			this.hideAll(markId);
			if (currentLiveStatus === '0') {
				this.initNoBegin(config);
			} else if (currentLiveStatus === '1' || currentLiveStatus === '11') {
				this.initReadyBegin(config);
			} else if (currentLiveStatus === '2' || currentLiveStatus === '3') {
				this.initBegining(config);
				$('#toolBarCollectBtn' + markId).hide();
			} else if (currentLiveStatus === '4') {
				this.initEndProcessEnd(config);
				$('#toolBarCollectBtn' + markId).hide();
				this.removeSwitchLiveIdBtn();
			}
		},

		/**
		 * 隐藏节点
		 */
		hideAll: function (markId) {
			$('#noBegin' + markId).hide();
			$('#readyBegin' + markId).hide();
			$('#begining' + markId).hide();
			$('.startReady' + markId).hide();
			$('#liveShift' + markId).hide();
			this.hideOnlineNum(markId);
			$('#readyBeginVodPlayer' + markId).html('');
			$('#beginingLivePlayer' + markId).html('');
			if (window.info.vodPlayer && window.info.vodPlayer.pause) {
				window.info.vodPlayer.pause();
			}
			if (window.info.livePlayer && window.info.livePlayer.pause) {
				window.info.livePlayer.pause();
			}
			$('#vidTitleText' + markId).hide();
			// 删除多视角
			$('#cameraSwitchBtn' + markId).remove();
			$('#cameraList' + markId).remove();
			$('#readyBeginDaoliu' + markId).remove();
			$('#breginningDaoliu' + markId).remove();
		},

		/**
		 * 显示在线人数
		 * @param markId
		 */
		showOnlineNum: function (markId) {
			if (!this.onLineNumShow) {
				events.emit('scrollNumShouldStart');
			}
			// 显示在线人数
			$('#toolBarOnLineNumCon' + markId).show();
			$('#videoToolBar' + markId).find('.j_logo').removeClass('logo');
			this.onLineNumShow = true;
		},

		/**
		 * 隐藏在线人数
		 * 如果之前在线人数显示这时候隐藏需要同时触发事件清掉定时器
		 * @param markId
		 */
		hideOnlineNum: function (markId) {
			var thisMarkId = markId || this.config.markId;
			if (this.onLineNumShow) {
				events.emit('scrollNumShouldStop');
			}
			$('#toolBarOnLineNumCon' + thisMarkId).hide();
			$('#videoToolBar' + thisMarkId).find('.j_logo').addClass('logo');
			this.onLineNumShow = false;
		},

		/**************************Start增加多机位逻辑，抽空抽离成一个功能块，单独放一个文件**************************/
		/**
		 * 增加多机位按钮逻辑
		 */
		addCamerasSwitchBtn: function () {
			var _self = this;
			var cameras = this.camerasList;
			var config = this.config;
			var markId = config.markId;
			if (!cameras || cameras.length === 0) {
				return;
			}
			var $shareBtn = $('#toolBarShareBtn' + markId);
			var $toolBarMallBtn = $('#toolBarMallBtn' + markId);
			var dom = '<li id="cameraSwitchBtn' + markId + '" class="ico_camera cur"><i class="icon_font icon_playback"></i><b class="arrow_top"></b></li>';
			if ($toolBarMallBtn.length > 0) {
				$toolBarMallBtn.before(dom);
			} else {
				$shareBtn.before(dom);
			}
			var $cameraSwitchBtn = $('#cameraSwitchBtn' + markId);

			var $toolBar = $('#videoToolBar' + markId);
			var contentDom = this.getCamerasTpl();
			$toolBar.after(contentDom);

			$cameraSwitchBtn.on('click', function (e) {
				var $this = $(e.currentTarget);
				_self.togglerCameras($this);
			});

			$('#cameraList' + markId).on('click', '.cameraItem', function (e) {
				var $cameraItems = $('#cameraList' + markId).find('.cameraItem');
				var $this = $(e.currentTarget);
				var switchLiveId = $this.attr('data-liveid');
				if (switchLiveId && switchLiveId !== _self.currentPlayerLiveId) {
					$cameraItems.removeClass('cur');
					$this.addClass('cur');
					// 删掉播放器上方的返回直播条，并显示倒流位
					$('#vidTitleText' + markId).hide();
					$('#breginningDaoliu' + markId).show();
					_self.doInitLivePlayer(switchLiveId);
				}
			});

			this.addIscroll();
		},

		/**
		 * 显示多机位层
		 */
		togglerCameras: function ($currentDom) {
			var config = this.config;
			var markId = config.markId;
			var $cameraDom = $('#cameraList' + markId);
			if ($cameraDom.css('display') === 'none') {
				$cameraDom.css('display', 'block');
				$currentDom.addClass('cur');
				this.addIscroll();
				return true;
			} else {
				$cameraDom.css('display', 'none');
				$currentDom.removeClass('cur');
				return false;
			}
		},

		/**
		 * 获取多机位容器结构
		 * @returns {string}
		 */
		getCamerasTpl: function () {
			var _self = this;
			var config = this.config;
			var markId = config.markId;
			var tplStr =  '<li data-liveid="{cameraLiveId}" class="cameraItem {curClass}">' +
							  '<a href="javascript:;">' +
								  '<span class="s_img">' +
									  '<img src="{cameraImage}">' +
								  '</span>' +
								  '<span class="s_cnt"><b>{cameraShowText}</b></span>' +
								  '<span class="s_tip"><i class="icon_font icon_playback"></i><b>正在播放</b></span>' +
							  '</a>' +
						  '</li>';
			var tpl = new Tpl(tplStr, function (item) {
				if (!item.cameraImage) {
					item.cameraImage = 'http://i0.letvimg.com/lc05_img/201601/11/14/37/1436/a_imgBg.png';
				}
				item.curClass = '';
				if (item.cameraLiveId === _self.currentPlayerLiveId) {
					item.curClass = 'cur';
				}
			});
			var lists = tpl.render(this.camerasList);
			var result = '<section id="cameraList' + markId + '" class="column cameraBox">' +
							'<div class="cameraCnt">' +
								'<ul>' + lists + '</ul>' +
							'</div>' +
						 '</section>';
			return result;
		},

		/**
		 * 为多机位增加横向iscroll滚动
		 */
		addIscroll: function () {
			var config = this.config;
			var markId = config.markId;
			var $cameraDom = $('#cameraList' + markId).find('.cameraCnt');
			var offsetWidth = 1;
			// 如果是编辑页，额外宽度增加的要多一点
			if (location.href.indexOf('editZtdiySubject') > -1) {
				offsetWidth = 10;
			}
			$cameraDom.find('ul').width(this.ensureWidth($cameraDom, offsetWidth));
			this.titleIscroll = new IScroll($cameraDom[0], {
				preventDefault: true,
				eventPassthrough: true,
				bounce: true,
				scrollX: true,
				scrollY: false
			});
		},

		/**
		 * 确定多机位宽度
		 * @param $item
		 * @param offsetWidth
		 * @returns {number}
		 */
		ensureWidth: function ($item, offsetWidth) {
			var width = 0;
			var itemLis = $item.find('li');
			var length = itemLis.length;
			for (var i = 0; i < length; i++) {
				width += itemLis.eq(i).width() + offsetWidth;
			}
			return width;
		},


		/**************************End增加多机位逻辑，抽空抽离成一个功能块，单独放一个文件**************************/

		/**
		 * 增加可切换直播流id按钮
		 */
		addSwitchLiveIdBtn: function () {
			var _self = this;
			var config = this.config;
			var markId = config.markId;
			var switchLiveId = config.switchLiveId;
			var liveId = config.liveId;
			var reg = /^\d+\d$/g;
			if (!reg.test(switchLiveId)) {
				return;
			}

			if ($('#switchLanguage' + markId).length !== 0) {
				$('#switchLanguage' + markId).removeClass('ico_eng');
				return;
			}

			var $shareBtn = $('#toolBarShareBtn'+markId);

			var dom = '<li id="switchLanguage' + markId + '" class="ico_lang"><span></span></li>';
			$shareBtn.before(dom);
			var $switchLanguageBtn = $('#switchLanguage' + markId);
			// 增加点击事件
			$switchLanguageBtn.on('click', function () {
				if (liveId === _self.currentPlayerLiveId) {
					// 切换成备用直播ID
					_self.doInitLivePlayer(switchLiveId);
					$switchLanguageBtn.addClass('ico_eng');
				} else if (switchLiveId === _self.currentPlayerLiveId) {
					// 切换成原直播ID
					_self.doInitLivePlayer(liveId);
					$switchLanguageBtn.removeClass('ico_eng');
				}
			});
		},

		/**
		 * 去掉可切换直播流id按钮
		 */
		removeSwitchLiveIdBtn: function () {
			var config = this.config;
			var markId = config.markId;
			$('#switchLanguage' + markId).remove();
		},

		/**
		 * 初始化直播播放器
		 * @param liveId
		 */
		doInitLivePlayer: function (liveId) {
			var that = this;
			var markId = this.config.markId;
			var config = this.config;
			this.currentPlayerLiveId = liveId;
			var paramObj = Url.parseParam(window.location.href);
			window.info.liveId = liveId;
			var liveVideoParam = {
				videoId: "beginingLivePlayer" + markId,
				liveInfo: [
					{
						pid: liveId,
						cid: config.cid,
						UIType: 'min',
						ark: config.ad,
						picStartUrl: config.startImg,
						ch: paramObj.ch
					}
				],
				event: this.playerEvents
			};

			Shift.getTimes({
				liveBeginTime : config.liveBeginTime,
				success : function(time){
					if(time){
						liveVideoParam.timeshift = time;
						events.emit('showShiftLayer');
					}
					// 直播播放器
					that.prepareLivePlayer(liveVideoParam);
				}
			});
		}
	};
	module.exports = conferenceLive;
});