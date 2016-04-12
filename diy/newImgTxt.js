/**
 * M站标签图文列表
 */
define(function (require, exports, module) {
	'use strict';
	var NavScroll = require('components/navScroll'),
		Tab = require('./diyModules/m_tab'),
		newImgTxtObj = {
			init: function (config) {
				var domId = config.domId;
				var $currentDom = $('#' + domId);
				var self_nav = $currentDom.find(".ztm_nav");
				this.navScroll = new NavScroll(self_nav, {
					noPos: true     //不增加定位参数sx
				});
				this.tab = new Tab($currentDom, {
					navs: $currentDom.find(".ztm_nav .ztm_nav_con li:not(.noLive)"),
					cons: $currentDom.find(".ztm_newImgTxt_con"),
					flag: $currentDom.find(".ztm_nav").attr("data-selectInd")
				});
				var navScroll = this.navScroll;
				if (navScroll._tab_scroll) {
					var activeEle = $currentDom.find('.active')[0];
					if(activeEle){
						navScroll._tab_scroll.scrollToElement(activeEle);
					}
				}
			}
		};
	module.exports = newImgTxtObj;
});
