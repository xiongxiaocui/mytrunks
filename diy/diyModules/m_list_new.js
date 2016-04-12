/**
 * M 站List组件（新）
 * author：liwenliang@letv.com
 */
define(function (require, exports, module) {
	'use strict';
	var Tpl = require('air/util/tpl');
	var ListNew = function () {
	};
	ListNew.prototype = {
		init: function (opt) {
			this.initDom(opt);
			this.initpage();
			this.pageID.trigger('click');
		},
		initDom: function (opt) {
			this.default_opt = $.extend({
				modleId: '',
				count: 9,             // 每页显示多少条数据
				rost: 1,              // 分页排序方式排序
				imageStyle: 0,
				Info: '180001'        // 视频类型
			}, opt);
			this.contID = $(this.default_opt.modleId).find('.ztm_imgCon');
			this.pageID = $(this.default_opt.modleId).find('.ztm_page');
			this.typeInfo = this.default_opt.Info;
			this.showTitle = this.default_opt.showTitle;
			this.imageStyle = this.default_opt.imageStyle;
			this.imageStyleMap = {
				'0': {
					imageHolder: 'http://i0.letvimg.com/lc05_img/201601/07/17/32/16-9.png',
					imageSize: '200*150'
				},
				'1': {
					imageHolder: 'http://i1.letvimg.com/lc05_img/201601/07/17/39/1739/16-10.png',
					imageSize: '320*200'
				},
				'2': {
					imageHolder: 'http://i2.letvimg.com/lc05_img/201601/07/17/39/1739/4-3.png',
					imageSize: '200*150'
				},
				'3': {
					imageHolder: 'http://i3.letvimg.com/lc05_img/201601/07/17/39/1739/3-4.png',
					imageSize: '300*400'
				}
			};
			this.showTitleMap = {
				'0': '',
				'1': '<span class="a_cnt MainSubTitle"><h3>{nameCn}</h3><p>{subTitle}</p></span>',
				'2': '<span class="a_cnt"><h3>{nameCn}</h3></span>',
				'3': '<span class="a_cnt"><h3>{subTitle}</h3></span>'
			};
		},
		initpage: function () {
			var scrollingLoader = require('air.util.scrollingLoader');
			var _this = this;
			var page = 1;
			var opt = {
				$loadBtn: _this.pageID,
				loadData: function () {
					$.getJSON(le.api_host.api + '/mms/out/albumInfo/getAllVideoList?callback=?', {
						s: _this.default_opt.count,
						b: page,
						id: _this.default_opt.pid,
						o: _this.default_opt.rost || '-1',
						type: _this.typeInfo,
						p: 420001,
						platform: 'web'
					}, function (json) {
						var data = json.data;
						if (!data) {
							_this.pageID.hide();
							return false;
						}
						var videoData = data.videoInfo,
							len = videoData.length;
						if (len < _this.default_opt.count) {
							_this.pageID.hide();
						}
						var html = _this.getTpl().render(videoData);
						_this.contID.append(html);
						Zepto('img[data-url]').imglazyload();
					});
					page++;
				}
			};
			new scrollingLoader(opt);
		},

		/**
		 * 获取模板对象
		 * @returns {Tpl}
		 */
		getTpl: function () {
			var imageHolder = this.imageStyleMap[this.imageStyle].imageHolder;
			var imageSize = this.imageStyleMap[this.imageStyle].imageSize;
			var titleHolder = this.showTitleMap[this.showTitle];
			var html = '<a href="'+ le.api_host.m_href +'/vplay_{id}.html" class="more_temp">' +
									'<span class="a_img">' +
										'<img src="' + imageHolder + '" alt="{nameCn}" data-url="{imageUrl}"/>' +
										'<i></i>' +
									'</span>' + titleHolder + '</a>';
			var tpl = new Tpl(html, function (item) {
				if (item.picAll) {
					item.imageUrl = item.picAll[imageSize] || "";
				} else {
					item.imageUrl = "";
				}
			});
			return tpl;
		}
	};
	module.exports = ListNew;
});