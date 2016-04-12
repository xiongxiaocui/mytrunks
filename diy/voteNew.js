/**
 * M站diy专题投票挂件（新）
 */
define(function (require, exports, module) {
	'use strict';
	var Vote = require('./diyModules/m_vote');
	var PageVote = require('./diyModules/m_pageVote');
	var VoteObj = {
		/**
		 * 投票实例数组
		 */
		voteItems: [],

		/**
		 * 投票挂件初始化函数
		 * 使用类名标记投票，能够分别对投票挂件进行实例化。
		 * @param domClass 某一个挂件有一个类，这里使用类名的目的是一个挂
		 * 件可以由多个投票实例
		 */
		init: function (config) {
			if (config.isPageable === '0' || !config.isPageable) {
				var domClass = config.domClass;
				var _self = this;
				$.each($('.' + domClass), function (i, item) {
					var vote = new Vote($(item), {
						voteBtn: $(item).find(".ztm_vote_btn"),
						ruleId: config.ruleId,
						customStyle: config.customStyle,
						customStyleTitle: config.customStyleTitle,
						customStyleSubtitle: config.customStyleSubtitle,
						customStyleUrl: config.customStyleUrl
					});
					_self.voteItems.push(vote);
				});
			} else if (config.isPageable === '1') {
				var pageVote = new PageVote();
				pageVote.init(config);
			}
		}
	};
	module.exports = VoteObj;
});


