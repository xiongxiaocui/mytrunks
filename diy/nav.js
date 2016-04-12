/**
 * M站导航挂件
 */
define(function (require, exports, module) {
	'use strict';
    var NavScroll = require('components/navScroll');
    var NavObj={
	    /**
	     * 程序初始化代码
	     * @param domid
	     */
	    init: function (config) {
		    var domId = config.domId;
		    var $currentDom = $('#' + domId);
		    if ($currentDom.find('li').length > 0) {
			    return new NavScroll($currentDom, {
				    noPos: true     //不增加定位参数sx
			    });
		    }
	    }
    };
    module.exports=NavObj;
})