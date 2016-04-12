/**
 * M站标签图文列表（新）
 */
__req('lib::iscroll.js');
define(function (require, exports, module) {
	'use strict';
	var Tab = require('./diyModules/m_tab');
	var ImgTxtObj = {
		/**
		 * 初始化函数
		 * @param domid 对应组件id
		 */
		init: function (config) {
			this.initDom(config);
			this.autoWidth = config.autoWidth;
			this.initWidget();
		},

		/**
		 * 初始化结构与变量
		 */
		initDom: function(config){
			this.$container = $('#' + config.containerId);
			this.$scroll = $('#' + config.scrollId);
		},

		/**
		 * 初始化组件
		 */
		initWidget: function(){
			var $domId = this.$container;
			this.initScroll();
			this.tab = new Tab($domId, {
				navs: $domId.find(".ztm_nav .ztm_nav_con li:not(.noLive)"),
				cons: $domId.find(".ztm_newImgTxt_con"),
				flag: '' + $domId.find(".ztm_nav").find('li.active').index()
			});
		},

		/**
		 * 初始化滚动组件
		 */
		initScroll: function () {
			if (this.autoWidth) {
				return;
			}
			var items = this.$scroll.find('li');
			var realWidth = 0;
			var itemLength = items.length;
			for (var i = 0; i < itemLength; i++) {
				realWidth += items.eq(i).width();
			}
			// 加itemLength的目的是为了保证宽度取整舍掉小数点部分造成宽度小于实际宽度，将标签挤下的问题
			this.$scroll.find('ul').width(realWidth + itemLength);
			this.tabScroll = new IScroll(this.$scroll[0], {
				preventDefault: true,
				eventPassthrough: true,
				click: false,
				useTransition: false,
				scrollX: true,
				scrollY: false,
				mouseWheel: false,
				fixedScrollbar: true,
				startX: 0
			});
			var activeEle = this.$scroll.find('li.active');
			this.tabScroll.scrollToElement(activeEle[0]);
		}
	};
	module.exports = ImgTxtObj;
});
