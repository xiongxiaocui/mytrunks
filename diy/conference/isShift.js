/**
 * @fileoverview 2015 判断是否是直播分享页面
 * @authors liuxiaoyue3@letv.com
 * @date 20150910
 */
define(function (require, exports, module) {
	var Url = require('air.util.Url');
    function isShiftPage(){
        var pageUrl = window.location.href;
        var paramObj = Url.parseParam(pageUrl);
        var time = parseInt(paramObj.shifttime,10);
        return time ? {
            is : time > 0,
            id : paramObj.pictextid,
            time : time
        } : {};
    }
	module.exports = isShiftPage;
});
