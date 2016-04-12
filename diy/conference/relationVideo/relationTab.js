/**
 * 相关视频Tab
 *
 * author：liwenliang（liwenliang@letv.com）
 */
define(function (require, exports, module) {
	'use strict';
	var events = require('../events');
	var Tpl = require('air/util/tpl');
	// 点播播放器组件
	var VodPlayer = require('../../diyModules/vodPlayer');
	// 直播播放器
	var LivePlayer = require('../../diyModules/livePlayer');
	var formatDuration = require('air/util/formatDuration');
	var Url = require('air/util/Url');
	var $ = Zepto;
	var RelationTab = {
		/**
		 * 初始化
		 */
		init: function (config) {
			this.initDom(config);
			this.initEvent();
			if ($('#relationTab_' + config.widgetId).hasClass('active')) {
				events.emit('requestRelationTab');
			}
		},

		/**
		 * 初始化DOM节点与功能需要的变量
		 */
		initDom: function (config) {
			this.defaultImg = 'http://i2.letvimg.com/lc05_img/201601/06/17/46/1744/a_tempBg2.png';
			this.pageCount = 4;
			this.config = config;
			var widgetId = this.widgetId = config.widgetId;
			this.relationPids = config.relationPids;
			this.configLiveId = config.liveId;
			this.orignConfig = config.orignConfig;
			this.$container = $('#relationWrap_' + widgetId);
			this.$tab = $('#relationTab_' + widgetId);
			this.pidListCount = 0;
			this.locked = false;
			this.currentPid = '';
			this.inited = false;
			this.errorCount = 0;
			this.playerEvents = {
				// 切换全屏状态 fullscreenObj.flag fullscreenObj.isActiveBehavior
				onChangeFullscreen: function (eventName, fullscreenObj) {
					events.emit('playerChangeFullscreen', fullscreenObj);
					return 'custom';
				}
			};
			if (!this.relationPids || this.relationPids.length === 0) {
				this.$container.remove();
				this.$tab.remove();
				return;
			}
		},

		/**
		 * 初始化事件
		 */
		initEvent: function () {
			// tab初始化以后可以通过事件监听的形式进行内容初始化
			events.on('requestRelationTab', $.proxy(this.initPage, this));
			this.$container.on('click', '.relationTabShowMore', $.proxy(this.doShowMore, this));
			this.$container.on('click', '.j_videoItem', $.proxy(this.onVideoClicked, this));
			this.$container.on('click', '.j_refreshRelationTab', $.proxy(this.onReloadTab, this));
			$('body').on('click', '.j_titlePlayBack', $.proxy(this.hideTitleContent, this));
		},

		/**
		 * 重新初始化这个tab
		 * 如果所有的数据都没有获取到，显示重新加载，这个时候要重新初始化Tab
		 */
		onReloadTab: function () {
			this.initDom(this.config);
			events.emit('requestRelationTab');
		},

		/**
		 * 当视频被点击后执行的逻辑
		 * 如果是在非直播状态进行的点击，则直接进行跳转，如果
		 * 在直播状态进行点击，则播放器切换视频，要保留当前直播id
		 */
		onVideoClicked: function (e) {
			var $this = $(e.currentTarget);
			var vid = $this.attr('data-vid');
			if (window.info && window.info.liveStatus === '2') {
				var title = $this.attr('data-title');
				var liveId = info.liveId || this.configLiveId;
				this.showTitleContent({
					title: title,
					liveId: liveId
				});
				var option = {
					videoId: 'beginingLivePlayer' + this.widgetId,
					vid: vid,
					ark: this.orignConfig.ad,
					UIType: 'min',
					event: this.playerEvents
				};
				this.prepareVodPlayer(option);
				window.scrollTo(0,0);
			} else {
				// 假如他后期相加上报，那这里的延迟是有必要的
				setTimeout(function () {
					window.location = le.api_host.m_href + '/vplay_' + vid + '.html';
				}, 500);
			}
		},

		/**
		 * 显示播放器上方的标题区域
		 */
		showTitleContent: function (obj) {
			var wid = this.widgetId;
			// 倒流位要隐藏
			$('#breginningDaoliu' + wid).hide();
			if ($('#vidTitleText' + wid).length > 0) {
				$('#vidTitleText' + wid).html(this.getTitleContent(obj));
				$('#vidTitleText' + wid).show();
			} else {
				var titleTplStr = '<section id="vidTitleText' + wid + '" class="column time_shift">' +
					this.getTitleContent(obj) +
					'</section>';
				$('#begining' + wid).before(titleTplStr);
			}
		},

		/**
		 * 隐藏播放器上方的标题区域
		 */
		hideTitleContent: function (e) {
			var $this = $(e.currentTarget);
			var liveId = $this.attr('data-liveid');
			var wid = this.widgetId;
			$('#vidTitleText' + wid).hide();
			// 倒流位要显示
			$('#breginningDaoliu' + wid).show();
			var paramObj = Url.parseParam(window.location.href);
			var option = {
				videoId: "beginingLivePlayer" + wid,
				liveInfo: [
					{
						pid: liveId,
						cid: this.orignConfig.cid,
						UIType: 'min',
						ark: this.orignConfig.ad,
						picStartUrl: this.orignConfig.startImg,
						ch: paramObj.ch
					}
				],
				event: this.playerEvents
			};
			this.prepareLivePlayer(option);
		},

		/**
		 * 获取内容区
		 * @param obj
		 */
		getTitleContent: function(obj){
			var contentStr = '<div class="tit_txt">{title}</div>' +
							 '<a data-liveid="{liveId}" href="javascript:;" class="ico_backplay j_titlePlayBack" style="display:block;">' +
								 '<span>' +
									 '<b>返回直播</b>' +
									 '<i class="icon_font icon_playback"></i>' +
								 '</span>' +
							 '</a>';
			var tpl = new Tpl(contentStr, function (item, order) {
			});
			return tpl.render(obj);
		},

		/**
		 * 加载更多按钮点击事件
		 */
		doShowMore: function (e) {
			var _self = this;
			var $this = $(e.currentTarget);
			var pid = this.currentPid = $this.attr('data-pid');
			this.getAjaxDataByPid(pid, function (data) {
				_self.getDataDone(pid, data);
			});
		},

		/**
		 * 获取模版内容
		 */
		getTplContent: function (pid, data) {
			var _self = this;
			if (!data || data.length === 0) {
				return '';
			}
			var obj = this.getObjByPid(pid);
			var showSubTitle = obj.pidListTitleType === '2';
			var tplStr = '<a data-vid="{id}" data-title="{clientShowTitle}" href="javascript:;" class="j_videoItem a_temp">' +
							 '<span class="a_img">' +
								 '<img src="' + this.defaultImg + '" data-url="{clientShowPic}">' +
								 '<small></small>' +
								 '<b class="bg"></b>' +
								 '{clientShowTime}' +
							 '</span>' +
							 '<span class="a_cnt">' +
							    '<h3>{clientShowTitle}</h3>' +
							 '</span>' +
						 '</a>';
			var tpl = new Tpl(tplStr, function (item, order) {
				if (item.picAll) {
					item.clientShowPic = item.picAll['320*200'] || _self.defaultImg;
				}
				item.clientShowTitle = showSubTitle ? item.subTitle : item.nameCn;
				item.clientShowTime = '';
				if (item.duration) {
					var tmpTime = formatDuration(item.duration, 'MM:SS');
					if (item.duration >= 3600) {
						tmpTime = formatDuration(item.duration, 'HH:MM:SS');
					}
					item.clientShowTime = '<span class="juji">' + tmpTime + '</span>';
				}
			});
			var resultHtml = tpl.render(data);
			$('#j_pidList_' + pid).find('.coslumn_body').append(resultHtml);
			$('img[data-url]').imglazyload();
		},

		/**
		 * 初始化专辑列表
		 */
		initPage: function () {
			if (this.inited) {
				return;
			}
			this.getContent();
			this.inited = true;
		},

		/**
		 * 获取内容块
		 */
		getContent: function () {
			var obj = this.relationPids[this.pidListCount];
			if (!obj) {
				return;
			}
			this.setContent();
		},

		/**
		 * 获取数据成功后要做的逻辑
		 * 获取到数据以后需要添加到对应的容器里边
		 */
		getDataDone: function (pid, res) {
			var item = this.getObjByPid(pid);
			if (!res || !res.videoInfo) {
				this.removeMoreBtn(pid);
				if (item.page === 1) {
					this.errorCount++;
					$('#j_pidList_' + pid).remove();
				}
			} else {
				if (res.videoInfo.length === 0 || res.videoInfo.length < item.pageCount) {
					this.removeMoreBtn(pid);
				}
				this.getTplContent(pid, res.videoInfo);
			}
			if (this.errorCount === this.relationPids.length) {
				var html = $('<div class="column no_loading"><i class="icon_font icon_tou"></i><p>糟了，网线被挖掘机铲走了，攻城狮已经去追了！</p><p><a href="javascript:;" class="j_refreshRelationTab">点击刷新</a></p></div>');
				this.$container.html(html);
				html.show();
				html = null;
			}
			// 一个pid获取成功以后获取后边的，直到最后一个结束
			this.getContent();
		},

		/**
		 * 如果没有了数据就不显示加载更多按钮了
		 * @param pid
		 */
		removeMoreBtn: function (pid) {
			$('#j_pidList_' + pid).find('.down_arrow').hide();
		},

		/**
		 * 根据专辑id和标题设置容器内容
		 * pid：专辑id
		 */
		setContent: function(){
			var _self = this;
			var pid = this.relationPids[this.pidListCount].pid;
			var obj = this.getObjByPid(pid);
			var showTitle = '<div class="column_no_tit"></div>';
			if (obj.title) {
				showTitle = '<div class="column_tit"><h2>' + obj.title + '</h2></div>';
			}
			var content = '<section id="j_pidList_' + obj.pid + '" class="correlation">' +
				              showTitle +
							  '<div class="coslumn_body">' +
							  '</div>' +
							  '<div class="down_arrow"><a class="relationTabShowMore" data-pid="' + obj.pid + '" href="javascript:;"></a></div>' +
						  '</section>';
			this.$container.append(content);
			this.pidListCount ++;
			this.getAjaxDataByPid(pid, function (data) {
				_self.getDataDone(pid, data);
			});
		},

		/**
		 * 通过ajax请求获取数据
		 */
		getAjaxDataByPid: function (pid, callback) {
			var _self = this;
			var obj = this.getObjByPid(pid);
			if (this.locked || !obj) {
				return;
			}
			this.locked = true;
			if (typeof obj.page === 'undefined') {
				obj.page = 1;
			}
			var typeInfo = '';
			if (obj.pidListType && obj.pidListType.length > 0) {
				typeInfo = obj.pidListType.join(',');
			}
			$.ajax({
				url: le.api_host.api + '/mms/out/albumInfo/getAllVideoList',
				dataType: 'jsonp',
				data: {
					s: obj.pageCount || this.pageCount,
					b: obj.page,
					id: pid,
					p: 420001,
					o: obj.pidListVideoOrder || '-1',
					type: typeInfo,
					platform: 'web'
				},
				success: function (res) {
					_self.locked = false;
					if (res.data) {
						obj.page++;
					}
					callback.call(_self, res.data);
				},
				error: function () {
					_self.locked = false;
				}
			});

		},

		/**
		 * 通过pid获取对应的数据对象，注意这里用的都是引用类型，对对象的操作都会影响到原始数据
		 * @param pid
		 * @returns {*}
		 */
		getObjByPid: function (pid) {
			for (var i = 0; i < this.relationPids.length; i++) {
				if (this.relationPids[i].pid === pid) {
					return this.relationPids[i];
				}
			}
			return null;
		},

		/**
		 * 初始化点播播放器
		 */
		prepareVodPlayer: function (options) {
			var vodPlayer = new VodPlayer();
			vodPlayer.init(options);
			window.info.vodPlayer = vodPlayer;
		},

		/**
		 * 直播播放器组件
		 * @param options
		 */
		prepareLivePlayer: function (options) {
			var livePlayer = new LivePlayer();
			livePlayer.init(options);
			// 直播播放器暴露在info下
			window.info.livePlayer = livePlayer;
		}
	};
	module.exports = RelationTab;
});