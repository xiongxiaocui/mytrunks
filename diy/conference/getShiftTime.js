/**
 * @fileoverview 2015 获取直播中时移时间
 * @authors liuxiaoyue3@letv.com
 * @date 20150910
 */
define(function (require, exports, module) {
	var isShift = require('diy/conference/isShift');
    var timeService = require('comp/TimeService');
    var getFormattedTime = require('air/util/getFormattedTime');

    //是否是时移分享页 播放器添加时移操作 针对播放时移参数
    var ShiftTime = {
        getTimes : function(params){
            var opt = $.extend({
                liveBeginTime : '',
                success : $.loop
            }, params);
            var shift = isShift();
            var liveBeginTime;
            //获取直播开始时间 单位s
            if(opt.liveBeginTime){
                liveBeginTime = getFormattedTime(opt.liveBeginTime);
            }
            if(shift.is && shift.time && (info.liveStatus === '2' || info.liveStatus === '3')){
                timeService.update(function(duration){
                    //直播已经开始时间偏移
                    var liveStarting = Math.floor(duration - liveBeginTime);
                    //编辑图文发布时间偏移
                    var shiftTime = Math.floor(duration - shift.time);
                    if(shiftTime < liveStarting && shiftTime > 0 && shiftTime < 24*3600){
                        opt.success && opt.success(shiftTime);
                    }else{
                        opt.success && opt.success();
                    }
                });
            }else if(info.liveStatus === '4' && shift.is && shift.time){
                timeService.update(function(duration){
                    //直播已经开始时间偏移
                    var liveStarting = Math.floor(duration - liveBeginTime);
                    //编辑图文发布时间偏移
                    var shiftTime = Math.floor(duration - shift.time);

                    //点播播放器偏移时间
                    var htime = liveStarting - shiftTime;
                    if(shiftTime < liveStarting && htime < 24*3600 && htime > 0){
                        opt.success && opt.success(htime);
                    }else{
                        opt.success && opt.success();
                    }
                });
            }else{
                opt.success && opt.success();
            }
        }
    };
	module.exports = ShiftTime;
});
