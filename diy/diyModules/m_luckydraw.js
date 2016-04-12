/**
 * M 站抽奖组件（新）
 * author：xiongxiaocui@letv.com
 *抽奖抓盘界面
 *逻辑点击抽奖按钮
 *如果未登陆，进入登陆界面
 *已经登陆，进入抽奖环节
 */
define(function (require, exports, module) {
    "use strict";
    //避免冲突
    var $ = Zepto;
    var apph5Adapter = require("components/app/apph5Adapter");
    var Url = require('air/util/Url');
    //定义抽奖转盘构造
    function Luckydraw($el, options) {
        this.wheel = typeof $el === 'string' ? $($el) : $el;
        this.options = $.extend({
            prizeLen: 8,
            angleRangeArr: [],
            defaultAngle: 3600,
            duration: 3600
        });
        //有参数的则用，无则默认；
        for (var i in options) {
            this.options[i] = options[i];
        }
        if (this.options.angleRangeArr.length === 0) {
            var prizeLenth = this.options.prizeLen;
            var angleStep = Math.floor(360 / prizeLenth);
            //为避免指针在两个奖项中间，范围左右各缩小5deg
            for (var x = 0; x <= prizeLenth - 1; x++) {
                this.options.angleRangeArr.push({
                    min: (x - 1) * angleStep + 10,
                    max: (x) * angleStep - 10
                });
            }
        }
    }

    Luckydraw.prototype = {
        _angleRange: null,
        _currentAngle: 0,
        /*开始抽奖逻辑开始*/
        play: function (res, callback) {
            var self = this;
            this.prizeOrder = res;
            this._callback = callback || "";
            this._angleRange = this.options.angleRangeArr[this.prizeOrder - 1];
            this._startRotate();

        },
        /*还原抽奖状态*/
        reset: function () {
            this.wheel.css({
                "-webkit-tranform": "rotate(0deg)",
                "-webkit-transition": "-webkit-tranform 1000ms ease-in-out"
            });
        },
        /*开始抽奖旋转逻辑*/
        _startRotate: function () {
            var self = this;
            var beforeOrder = this.prizeOrder;
            this._targetAngle = this._currentAngle + (360 - this._currentAngle % 360) + this.options.defaultAngle - this._randomAngle(this._angleRange.min, this._angleRange.max);
            this.wheel.css({
                "-webkit-transform": "rotate(" + this._targetAngle + "deg)",
                "-webkit-transition": "-webkit-transform " + this.options.duration + "ms ease-in-out"
            });
            /*
             抽奖结束函数，可以增加回调
             **/
            this.wheel.on("transitionend webkitTransitionEnd", function () {
                self._repeat = false;
                if (self._callback) {
                    self._callback();
                }
            });
            this._currentAngle = this._targetAngle;
            this.prizeOrder = beforeOrder;

        },
        stopRotate: function (callback) {
            if (callback) {
                callback();
            }
        },
        _randomAngle: function (a, b) {
            return a = a || 0,
                b = b || 0,
                Math.floor(Math.random() * (b - a + 1) + a);
        }
    };
    var options = {};
    var Luckywheel = function () {
    };
    Luckywheel.prototype = {
        _locked: false,
        _repeat: true,

        init: function (config) {
            this.initDom(config);
            this._createWheel();
            this.initEvent(config);
        },

        initDom: function (config) {
            this.widgetId = config.id;
            this.luckyWheel = null;
            this.$domId = $("#" + config.domId);
            this.activityId = config.luckyDrawId;
            this._win = $(window);
            this._startBtn = $("#j-startbtn" + this.widgetId);
            this._tips = $("#j_tips" + this.widgetId);
            this._prizeRecorder = $("#suc_draw" + this.widgetId);
            this._prizeInner = this._prizeRecorder.find("a");
        },

        _createWheel: function () {
            this.luckyWheel = new Luckydraw(this.$domId, options);
        },

        initEvent: function (config) {
            var self = this;
            this._win.on("load", function () {
                self._loadCallBack.call(self);
            });
            this._startBtn.on("tap", function () {
                self._start();
            });
            this._prizeInner.on("click", function (config) {
                self._gotoprize(config);
            });

        },

        _gotoprize: function (activityId) {
            this._locked = true;
            var userid = $.cookie('ssouid');
            //如果已经登录
            if (userid) {
                //获取中奖纪录的接口
                var prizeUrl = "http://hd.my.le.com/lotterydraw/prizeRecord?activityid=" + this.activityId + '&uid=' + encodeURIComponent(userid);
                window.location.href = prizeUrl;
            } else {
                //不跳转，先登录，在跳转登录链接
                this._showTips({
                    html: "<li>查看中奖记录先登录，即将带您去登录~</li>"
                });
                try {
                    setTimeout(function () {
                        window.location.href = le.api_host.sso_http + '/user/mloginHome?next_action=' + encodeURIComponent(window.location.href);
                    }, 1500);
                    return;
                } catch (error) {
                    console.log(error);
                }
            }

        },
        _start: function () {
            if (!$.cookie('ssouid')) {
                //开始抽奖，如果为登录，先登录
                this._showTips({
                    html: "<li>抽奖需先登录，即将带您去登录~</li>"
                });
                try {
                    setTimeout(function () {
                        window.location.href = le.api_host.sso_http + '/user/mloginHome?next_action=' + encodeURIComponent(window.location.href);
                        $.cookie('lottery', '1', {
                            expires: 1
                        });
                    }, 1500);
                    return;
                } catch (error) {
                    console.log(error);
                }
            } else {
                //如果已登录，直接进入抽奖界面
                this._locked = false;
                this._lottery();
            }

        },

        _loadCallBack: function () {
            var self = this;
            var flag = this._locked;
            if ($.cookie("lottery") && $.cookie("ssouid") && flag === true) {
                this._lottery();
            }
            var myuserid = $.cookie("lotteryId");
            if ($.cookie("selectAddrid")) {
                //此处请求接口，主要是填写完中奖地址之后，会出现保存地址的弹层，此处需要传入的是活动id，抽奖id，以及在填写完地址之后所存的selectAddrid
                var url = le.api_host.hd_my + "/lotterydraw/saveAddress?callback=&activityid=" + this.activityId + "&id=" + $.cookie("lotteryId") + "&addressid=" + $.cookie("selectAddrid");
                $.ajax({
                    url: url,
                    data: {},
                    dataType: "jsonp",
                    success: function (json) {
                        var status = json.code || '';
                        var addmsg = json.msg || '';
                        switch (+status) {
                            case 200:
                                self._showTips({
                                    html: "<li>" + addmsg + "</li>"
                                });
                                break;
                            case 500:
                                self._showTips({
                                    html: '<li>' + addmsg + '</li>'
                                });
                        }
                    },
                    error: function (e) {
                        console.log(e);
                    }
                });
            }
            //地址id提交后，删除cookie;
            $.removeCookie("selectAddrid", {
                expires: 1,
                path: "/",
                domain: "." + le.api_host.main
            });
            self._destroy();
        },

        _lottery: function () {
            var self = this;
            var isrepeat = self._repeat;

            if ($.cookie("lottery")) {
                $.removeCookie("lottery");
            }
            if (this._startBtn.hasClass("active")) {
                this._showTips({
                    html: "<li>抱歉，您今天没有抽奖机会~</li>"
                });
            }
            //如果转盘锁住，则不进行任何操作
            if (self._locked || "undefined" == typeof self.activityId) {
                return false;
            }
            self._locked = false;
            self._repeat = false;
            //如果转盘为锁住，并且存在活动id，则直接请求抽奖接口，抽奖接口需要活动id
            var url = le.api_host.hd_my + "/lotterydraw/run?activityid=" + self.activityId;
            if (isrepeat) {
                $.ajax({
                    url: url,
                    dataType: "jsonp",
                    success: function (json) {
                        isrepeat = false;
                        self._success(json);
                    },
                    error: function (e) {
                        console.log(e);
                    }
                });
            }
        },
        _success: function (json) {
            var self = this;
            var res = json.data.postion || "";
            var jscode = parseInt(json.code) || "";
            var jstype = parseInt(json.data.type) || "";
            var jsnum = json.data.num;
            var jsonmark = json.data.markedword || "";
            var jsonname = json.data.name || "";
            var jsonmsg = json.msg || "";
            var userid = $.cookie('ssouid');
            var prizeUrl = "http://hd.my.le.com/lotterydraw/prizeRecord?activityid=" + self.activityId + '&uid=' + encodeURIComponent(userid);
            var lihtml = '';
            switch (jscode) {
                case 200:
                    self.luckyWheel.play(res, function () {
                        switch (jstype) {
                            case 1:
                                lihtml = jsonmark;
                                lihtml+='<a href="'+prizeUrl+'" >去中奖纪录查看</a>';
                                break;
                            default:
                                lihtml = jsonmark;
                        }
                        options = {};
                        var liframe = "<li>" + lihtml + "</li>";
                        options.html = liframe;
                        options.needConfirm = 1 === +jstype ? 1 : 0;
                        self._showTips(options);
                        $.cookie("lotteryId", json.data.id);
                        self._locked = false;
                    });
                    break;
                case 201:
                    self.luckyWheel.stopRotate(function () {
                        self._showTips({
                            html: jsonmark || jsonmsg
                        });
                        window.location.href = le.api_host.sso_http + "/user/mloginHome?next_action=" + encodeURIComponent(window.location.href);
                        $.cookie("lottery", "1", {
                            expires: 1
                        });
                    });
                    break;
                default:
                    self.luckyWheel.stopRotate(function () {
                        if (jsonmark === '') {
                            jsonmark = jsonmsg;
                        }
                        self._showTips({
                            'html': '<li>' + jsonmark + '</li>'
                        });
                        self._locked = false;
                    });
            }

        },

        _showTips: function (options) {
            var self = this;
            self._tips.find(".rst").html(options.html);
            self._tips.show();
            //如果不需要用户确定，则弹层会在1.5s之后消失
            if (!options.needConfirm) {
                setTimeout(function () {
                        $(".tips").hide();
                        self._repeat = true;
                    },
                    2000);
            }
        },

        _destroy: function (activityId) {
            //在页面开始的回调之前，清除相关方法以及变量
            this._win.off("load", function () {
                this._loadCallBack.call(this);
            });
            delete this._loadCallBack;
            this._win = null;
        }
    };
    module.exports = Luckywheel;
});
