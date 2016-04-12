/**
 * M站新列表组件
 */
define(function (require, exports, module) {
	'use strict';
	var List = require('./diyModules/m_list_new');
	var ListObj = {
		init: function (opt) {
			this.list = new List();
			this.list.init(opt);
		}
	};
	module.exports = ListObj;
});