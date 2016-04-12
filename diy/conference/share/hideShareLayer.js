/**
 * @fileoverview 2015 隐藏分享组件浮层
 * @authors liuxiaoyue3@letv.com
 * @date 20150910
 */
define(function(require,exports,module){
	var events = require('./../events');
	//分享层 点击页面其他地方隐藏分享层
    $(document).on('touchstart click',function(e){
        if($(e.target).closest('.ico_share1').attr('time') || $(e.target).closest('.ico_share').length > 0){
            return;
        }
        events.emit('hideToolShareLayer');
        events.emit('hidePicTextShareLayer');
    });
});