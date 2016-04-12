/**
 * M站diy自动调取翻页，list页挂件
 */
define(function (require, exports, module) {
	var List = require('./diyModules/m_list'),
        ListObj = {
       		init: function (opt) {
          		new List(opt);
        	}
   		};
 	module.exports = ListObj;
});