define(function (require, exports, module) {
	'use strict';
	var Vote = require('./diyModules/m_vote'),
		VoteObj = {
			init: function (config) {
				var domId = config.domId;
				var $currentDom = $('#' + domId);
				return new Vote($currentDom, {
					voteBtn: $currentDom.find(".ztm_vote_btn"),
					ruleId: config.ruleId
				});
			}
		};
	module.exports = VoteObj;
});


