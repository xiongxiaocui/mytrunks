/**
 *  解说弹幕
 * @authors slydslt@letv.com
 * @date 20150910
 */
define(function (require, exports, module) {

    var ua = require('air/env/ua');
    var events = require('./../events');
    var isSpecialEnv = ua.weibo || (ua.weixin && !ua.src.match(/MQQBrowser/i)) || ua.chrome || ua.ios;
    var commentary = {

        _msgStack: new Array(), //消息队列
        _msgMaxLen: 0, //消息队列保存的消息条目数,多余该数目的消息数目会被丢弃，0为不限制条数，不丢弃
        _showTime: 0,
        _isTopBarOpen:false, //置顶解说条是否在开启状态
        _wordSpeed:5, //每个字的基准速度
        _miniSpeed:7, //最小速度
        _baseTextCount:25, //默认的速度文字个数
        _isScrolling:false, //是否正在滚动文字
        _isProcessing:false, //是否正在显示流程当中(即所有流程正在执行当中)
        _isStopReceive:false, //是否停止接收解说弹幕消息
        _waitTimer:null, //等待的计时器 (需要在某些情况下清楚)
        _topBarText:'使用乐视视频APP 看直播更流畅', //导流文案
        _topBarSportText:'全球赛事高清直播 下载乐视体育APP', //体育频道导流文案
        /**
         * 入口
         */
        init: function (config) {
            //if(!opt.liveId) return;
            //this._widgetId = opt.widgetId;
            //this._getRoomId( opt );
            this.initDom(config);
            this.initEvent();
        },

        /**
         * 初始化节点
         */
        initDom: function (config) {
            var self = this;


            this.config = config;
            var markId =  config&&this.config.markId?this.config.markId:"";


            var homeBanner = window.__PromotionApp&&window.__PromotionApp.commonBanner;
            if(homeBanner&&homeBanner.app == 'lesport'){
                self._topBarText='全球赛事高清直播 下载乐视体育APP';
            }

            self.$palyerDom = $('#beginingLivePlayer' + markId); //获得播放器节点
            self.screenWidth = $(document).width(); //文档宽度
            self.$daoliuTextSpan = $(".daoliu_cnt span");


            //根据环境初始化节点
            if (isSpecialEnv) {
                //如果支持在播放器上覆盖，则初始化播放器上的节点
                self.$cmt_barrageHost = $(".cmt_barrageHost");
                if (this.$cmt_barrageHost.length <= 0) {
                    //解说内容
                    var barrageText = self._topBarText;
                    //如果没有解说dom节点，则创建
                    var comHtml = '<div class="cmt_barrageHost" >' +
                        '<a href="javascript:;" class="cmt_barrageHost_btn opacity_effect" id="j_cmt_barrageHost_close">解说</a>' +
                        '<div class="cmt_barrageHost_cnt will_change">' +
                        '<a href="javascript:;" class="cmt_barrageHost_ico icon_font icon_close" id="j_close"></a>' +
                        '<div class="cmt_barrageHost_txt">' +
                        '<span class="cmt_barrageHost_inner will_change">' + barrageText + '</span>' +
                        '</div>' +
                        '</div>' +
                        '</div>';
                    self.$palyerDom.after(comHtml);
                }

                //覆盖在播放器上的解说弹幕区域
                self.$cmt_barrageHost = $(".cmt_barrageHost");
                //覆盖在播放器上的解说弹幕文字区域节点
                self.$cmt_barrageHost_cnt = $('.cmt_barrageHost_cnt');
                //初始化播放器上的解说弹幕文字区域节点的高度(默认为在播放器上方节点后方并隐藏)
                var cmt_barrageHost_cntHeight = self.$cmt_barrageHost_cnt.height();
                self.$cmt_barrageHost_cnt.css("transform", "translateY(-" + (cmt_barrageHost_cntHeight + 5) + "px)");
                //覆盖在播放器上的解说弹幕文字span节点
                self.$coverTextSpan = $(".cmt_barrageHost .cmt_barrageHost_inner");
                //覆盖在播放器上的“解说”按钮
                self.$openBarrageBtn = $("#j_cmt_barrageHost_close");
                self.$openBarrageBtn.on("click", function () {
                    self.hideBtnAndShowTopBar(function () {
                    });
                });
                //解说弹幕关闭按钮
                self.$cmt_barrageHostCloseBtn = $(".cmt_barrageHost_ico");
                self.$cmt_barrageHostCloseBtn.on("click", function () {
                    //if(!self._isStopReceive){
                    //    self.hideTopBarAndShowBtn();
                    //}
                    self.hideTopBarAndShowBtn();
                    //self.clearMsgAndStopAll();
                    Stats.sendAction({lid:config.liveId, ap: 'ch=liveplay&pg=live_diy&bk=close_commentary&link=close'});
                });
            } else {
                //不支持在播放器上覆盖，则取得导流位相关节点
                self.$daoliuTextSpan = $(".daoliu_cnt span");
            }
        },

        /**
         * 初始化事件
         */
        initEvent: function () {

            //注册显示解说事件
            events.on('showCommentary', _.bind(this.showCommentary, this));
            //注册显示解说事件
            //events.on('showHCommentary', _.bind(this.showHCommentary, this));
            //监听进入假全屏事件
            events.on('setOrtPlayerFullScreen', _.bind(this.setOrtPlayerFullScreen,this));
            //监听退出假全屏事件
            events.on('offOrtPlayerFullScreen', _.bind(this.offOrtPlayerFullScreen,this));

        },

        /**
         * 响应进入假全屏事件
         */
        setOrtPlayerFullScreen:function(){
            var self=this;

            if(isSpecialEnv) return;
            self.clearMsgAndStopAll();
            self.hideTopBar();
            self._isStopReceive=true; //假全屏状态下应该阻止接收消息

            if(self.$daoliuTextSpan&&self.$daoliuTextSpan.length>0){
                self.$daoliuTextSpan.text(self._topBarText);
                self.$daoliuTextSpan.removeClass("linear_transform_effect");

                self.$daoliuTextSpan.css({
                    "visibility": "visible",
                    "-webkit-transition-duration": "",
                    "transition-duration": "",
                    "-webkit-transition-timing-function": "",
                    "transition-timing-function": "",
                    "-webkit-transform": "",
                    "transform": ""
                });
            }

            $(".daoliu_cnt").html("");
            $(".daoliu_cnt").html("<span>"+self._topBarText+"</span>");
            self.$daoliuTextSpan = $(".daoliu_cnt span");
        },

        /**
         * 响应退出假全屏事件
         */
        offOrtPlayerFullScreen:function(){
            var self=this;
            if(isSpecialEnv) return;
            self._isStopReceive=false; //退出假全屏后恢复接收解说消息
            self.clearMsgAndStopAll();
            //某些特殊边界情况，退出全屏仍然会未重置样式，这里再重置一次
            if(self.$daoliuTextSpan&&self.$daoliuTextSpan.length>0){
                self.$daoliuTextSpan.text(self._topBarText);
                self.$daoliuTextSpan.removeClass("linear_transform_effect");

                self.$daoliuTextSpan.css({
                    "visibility": "visible",
                    "-webkit-transition-duration": "",
                    "transition-duration": "",
                    "-webkit-transition-timing-function": "",
                    "transition-timing-function": "",
                    "-webkit-transform": "",
                    "transform": ""
                });
            }

            $(".daoliu_cnt").html("");
            $(".daoliu_cnt").html("<span>"+self._topBarText+"</span>");
            self.$daoliuTextSpan = $(".daoliu_cnt span");

        },

        /**
         * 单条输出消息数组里的消息
         * @param msg
         * @private
         */
        showCommentary: function (msg) {

            var self=this;

            //检测环境
            isSpecialEnv = ua.weibo || (ua.weixin && !ua.src.match(/MQQBrowser/i)) || ua.chrome || ua.ios;

            //需要重新绑定一下事件
            //if(self.$cmt_barrageHostCloseBtn&&self.$cmt_barrageHostCloseBtn.length>0){
            //    self.$cmt_barrageHostCloseBtn.off("click");
            //    self.$cmt_barrageHostCloseBtn.on("click", function () {
            //        self.clearMsgAndStopAll();
            //        self.hideTopBarAndShowBtn();
            //        Stats.sendAction({lid:self.config.liveId, ap: 'ch=liveplay&pg=live_diy&bk=close_commentary&link=close'});
            //    });
            //}

            if(!self.$daoliuTextSpan){
                self.initDom();
            }

            self.pullMessage(msg);

            //“解说”按钮显示时丢弃解说消息
            if(!self._isStopReceive){
                //self.pullMessage(msg);

                if((!self._isStopReceive)&&(!self._isProcessing)&&self._msgStack.length>0) {
                    self.processAll(); //流程都走完才需要调用 总流程方法，否则流程中会自动运行
                }
            }

        },

        /**
         * 清空消息队列并停止一切逻辑后续
         */
        clearMsgAndStopAll:function(){
            var self=this;

            self._msgStack=[]; //清空消息队列
            self._isProcessing=false;
            self._isStopReceive=false;
            window.clearTimeout(self._waitTimer);
        },

        /**
         * 整体流程控制
         */
        processAll: function () {
            var self = this;

            if(self.$cmt_barrageHostCloseBtn&&
                self.$cmt_barrageHostCloseBtn.length>0){
                self.$cmt_barrageHostCloseBtn.show(); //显示关闭按钮
            }

            //TODO:测试
            //isSpecialEnv=false;

            var msg = self.isHasNextCommentary();
            if (msg) {
                self._isProcessing=true; //标记正在流程中
                if (isSpecialEnv) {
                    //兼容模式
                    self.hideTopBarBtn(); //保证关闭解说按钮
                    if(!self.showText(self.$coverTextSpan, msg.message)){
                        self.showTopBar(function () {
                            self.waitFor(function () {
                                self.pushTextToLeft(self.$coverTextSpan,function(){
                                    self.processRockNextText(self.$coverTextSpan);
                                });
                            }, 3000);
                        });
                    }else{
                        self.showTopBar(function () {
                            self.waitFor(function () {
                                self.processRockText(self.$coverTextSpan);
                            }, 3000);
                        });
                    }

                } else {
                    self.waitFor(function(){
                        self.pushTextToLeft(self.$daoliuTextSpan, function () {
                            self.rockTextFromRight(self.$daoliuTextSpan, msg.message, function () {
                                self.processRockNextText(self.$daoliuTextSpan);
                            });
                        });
                    },2000);

                }
            }


        },

        /**
         * 控制文字显示流程，本方法主要是会把原先的文字向左推出，调用processRockNextText前应当调用本方法
         */
        processRockText: function (dom) {

            var self = this;
            var msg = self.isHasNextCommentary();
            if (msg) {

                if(self.$cmt_barrageHostCloseBtn&&
                    self.$cmt_barrageHostCloseBtn.length>0){
                    self.$cmt_barrageHostCloseBtn.show(); //显示关闭按钮
                }

                self._isProcessing=true; //标记正在流程中
                self.pushTextToLeft(dom, function () {
                    self.rockTextFromRight(dom, msg.message, function () {
                        self.processRockNextText(dom);
                    });
                });
            } else {
                if(isSpecialEnv){
                    self.hideTopBar(function(){
                        self._isProcessing=false;
                    });
                }else{
                    self.rockLastTextFromRight(dom,self._topBarText,function(){
                        self._isProcessing=false;
                    });
                }
            }
        },

        /**
         * 判断有没有下一条消息，有就一直滚动加载，否则收藏消息条
         * 本函数使用递归方法实现
         */
        processRockNextText: function (dom) {
            var self = this;
            var msg = self.isHasNextCommentary();
            if (msg) {
                self._isProcessing=true; //标记正在流程中
                self.rockTextFromRight(dom, msg.message, function () {
                    self.processRockNextText(dom);
                });
            } else {
                //兼容模式下隐藏置顶条，非兼容模式下显示默认消息
                if(isSpecialEnv){
                    self.hideTopBar(function(){
                        self._isProcessing=false; //标记流程已结束
                    });
                }else{
                    self.rockLastTextFromRight(dom,self._topBarText,function(){
                        self._isProcessing=false; //标记流程已结束
                    });
                }
            }
        },

        /**
         * 判断是否有下一条消息(其实就是判断是否还存在消息)
         * @returns {boolean} 如果还有消息，则返回该消息，否则返回false
         */
        isHasNextCommentary: function () {
            var self = this;
            var r = false;
            if (self._msgStack.length > 0) {
                //如果消息队列里有消息
                r = self.popMessage();

            } else {
                //如果消息队列里没有消息
                r = false;
            }
            return r;
        },



        /**
         * 获取滚动速度
         * @param textLength
         * @returns {number}
         */
        getSpeed:function(textLength,baseSpeed){
            var self=this;
            if(!baseSpeed)baseSpeed=self._miniSpeed; //默认基本速度为设置速度
            var textSize=self._baseTextCount; //基本速度文字个数
            var fSpeed=baseSpeed; //最终的速度
            if(textLength>textSize){
                //30个字以内都是4秒的速度
                //超过30个字的，每个字都0.15s
                fSpeed=baseSpeed+((textLength-textSize)*0.2);
            }
            return fSpeed;
        },

        /**
         * 向左移走指定节点的文字，结束后调用回调函数参数nextFun
         * @param textDom 要操作的文字节点，向左移动，并从右边显示的应该都是该节点
         * @param speedFactor 速度系数小数，eg:1.5 ，速度系数越大，滚动速度越慢，越小速度越快，默认为1.5
         * @param nextFun 右移结束后执行的函数，会将spanDom参数传入
         */
        pushTextToLeft: function (spanDom, nextFun, speedFactor) {
            if (spanDom && spanDom.length <= 0) return;
            if (!speedFactor)speedFactor = 1.5; //速度系数默认为1.5
            speedFactor=1;
            var self = this;
            if(isSpecialEnv&&!self._isTopBarOpen)return; //兼容并且顶部解说条未显示就则退出
            //节点宽度
            var spanDomWidth = spanDom.width();
            var aniTime = spanDomWidth * 7 * speedFactor; //动画持续时间，单位为毫秒 算法为：文字容易宽度*10*速度系数
            aniTime=self.getSpeed(spanDom.text().length,2);

            spanDom.addClass("linear_transform_effect");
            spanDom.css({
                "-webkit-transition-duration": aniTime + "s",
                "transition-duration": aniTime + "s",
                "-webkit-transition-timing-function": "linear",
                "transition-timing-function": "linear"
            });

            var t = window.setTimeout(function () {
                var leftOffset = spanDomWidth +30; //获取节点的移出边距
                //$footer[0].offsetTop + ($footer[0].offsetParent.offsetTop) + $footer.height();
                spanDom.css({
                    "-webkit-transform": "translateX(" + (-leftOffset) + "px)",
                    "transform": "translateX(" + (-leftOffset) + "px)"
                });
                self._isScrolling=true; //标记正在滚动
                spanDom.one("webkitTransitionEnd transitionend", function () {
                    spanDom.off("webkitTransitionEnd transitionend");
                    spanDom.removeClass("linear_transform_effect");
                    spanDom.css({
                        "-webkit-transition-duration": "",
                        "transition-duration": "",
                        "-webkit-transition-timing-function": "",
                        "transition-timing-function": ""
                    });
                    //清除定时器
                    window.clearTimeout(t);
                    self._isScrolling=false; //标记滚动结束
                    if (nextFun&&(!(isSpecialEnv&&!self._isTopBarOpen))) {
                        nextFun(spanDom); //执行参数传递的函数
                    }
                });
            }, 50);
        },

        /**
         * 对html 转义编码进行转换
         * @param str 转以后的字符串
         */
        transcoding:function(str){
            var coded=str.replace(/amp;/g,'');
            var divObj = document.createElement("div");
            divObj.innerHTML = coded;
            //var outstr = divObj.innerText;
            return divObj.innerText;
        },

        /**
         * 文字从右边滚动到左边起始位置，主要用于导流位最后恢复导流文字
         * @param spanDom 操作的节点
         * @param nextText 恢复文字内容
         * @param nextFun 结束后调用的回调函数
         * @param speedFactor 动画速度系数
         */
        rockLastTextFromRight:function(spanDom,nextText,nextFun,speedFactor){
            if (!spanDom && spanDom.length <= 0) return;
            if (!speedFactor)speedFactor = 1.5; //速度系数默认为1.5
            speedFactor=1;
            if (!nextText)nextText = "";
            var self = this;
            if(isSpecialEnv&&!self._isTopBarOpen) return; //如果置顶解说条未显示则不执行
            self.screenWidth = $(document).width(); //文档宽度，需要重新获取一次，以便在横屏时计算正确
            spanDom.css({
                "visibility": "hidden",
                //"visibility": "visible",
                "-webkit-transition-duration": "",
                "transition-duration": "",
                "-webkit-transition-timing-function": "",
                "transition-timing-function": "",
                //"-webkit-transform": "translateX(0px)",
                //"transform": "translateX(0px)"
            });
            spanDom.removeClass("linear_transform_effect");

            spanDom.html(nextText);
            //节点宽度
            var spanDomWidth = spanDom.width();
            var aniTime = spanDomWidth * 7 * speedFactor; //动画持续时间，单位为毫秒 算法为：文字容易宽度*10*速度系数
            aniTime=self.getSpeed(spanDom.text().length,2);

            //偏移值，即以屏幕宽度的偏移，即右边按钮的大小
            var offsetW = 10;
            //非兼容模式下偏移较大
            if (!isSpecialEnv)offsetW = 70;
            var rightOffset = self.screenWidth - offsetW;
            //var leftOffset = spanDomWidth - 10;

            var t1 = setTimeout(function () {

                spanDom.css({
                    "-webkit-transform": "translateX(" + rightOffset + "px)",
                    "transform": "translateX(" + rightOffset + "px)"
                });
                var t2 = setTimeout(function () {

                    //如果不适合居中则一直滚动结束
                    spanDom.addClass("linear_transform_effect");

                    spanDom.css({
                        "visibility": "visible",
                        "-webkit-transition-duration": aniTime + "s",
                        "transition-duration": aniTime + "s",
                        "-webkit-transition-timing-function": "linear",
                        "transition-timing-function": "linear",
                        "-webkit-transform": "translateX(0px)",
                        "transform": "translateX(0px)"
                    });
                    self._isScrolling=true; //标记正在滚动
                    spanDom.one("webkitTransitionEnd transitionend", function () {
                        //清除绑定事件
                        spanDom.off("webkitTransitionEnd transitionend");
                        //移除动画类
                        spanDom.removeClass("linear_transform_effect");
                        //移除style样式
                        spanDom.css({
                            "-webkit-transition-duration": "",
                            "transition-duration": "",
                            "-webkit-transition-timing-function": "",
                            "transition-timing-function": ""
                        });
                        //清除定时器
                        window.clearTimeout(t1);
                        window.clearTimeout(t2);
                        //window.clearTimeout(t3);
                        self._isScrolling=false; //标记滚动结束
                        //调用回调函数
                        if (nextFun&&(!(isSpecialEnv&&!self._isTopBarOpen))){
                            nextFun();
                        }
                    });


                }, 150);
            }, 100);
        },

        /**
         * 指定解说字幕从右至左移动直到移出(如果在兼容模式下，并且内容较少，会在居中位置停留指定时间)
         * @param spanDom 要操作的文字节点
         * @param nextText 从右边移入的文字内容
         * @param nextFun 结束移出后调用的回调
         * @param speedFactor 速度系数
         */
        rockTextFromRight: function (spanDom, nextText, nextFun, speedFactor) {
            if (!spanDom && spanDom.length <= 0) return;
            if (!speedFactor)speedFactor = 1.5; //速度系数默认为1.5
            speedFactor=1;
            if (!nextText)nextText = "";
            var self = this;
            if(isSpecialEnv&&!self._isTopBarOpen) return; //如果置顶解说条未显示则不执行
            var centerTimeout = 3000; //居中停留时间，单位为毫秒
            self.screenWidth = $(document).width(); //文档宽度，需要重新获取一次，以便在横屏时计算正确

            spanDom.css({
                "visibility": "hidden",
                //"visibility": "visible",
                "-webkit-transition-duration": "",
                "transition-duration": "",
                "-webkit-transition-timing-function": "",
                "transition-timing-function": "",
                //"-webkit-transform": "translateX(0px)",
                //"transform": "translateX(0px)"
            });
            spanDom.removeClass("linear_transform_effect");

            var lclass='jieshuo_l';
            if(isSpecialEnv){
                lclass='jieshuo_cover';
            }
            var leadDom='<em class="'+lclass+'">[解说]</em>'+nextText;
            spanDom.html(leadDom);
            //节点宽度
            var spanDomWidth = spanDom.width();
            var aniTime = spanDomWidth * 7 * speedFactor; //动画持续时间，单位为毫秒 算法为：文字容易宽度*10*速度系数
            aniTime=self.getSpeed(spanDom.text().length);
            //偏移值，即以屏幕宽度的偏移，即右边按钮的大小
            var offsetW = 10;
            //非兼容模式下偏移较大
            if (!isSpecialEnv)offsetW = 70;
            var rightOffset = self.screenWidth - offsetW;
            var leftOffset = spanDomWidth +30;
            var is_center = false;
            var centerOffset = leftOffset;
            if (spanDomWidth > self.screenWidth - offsetW) {
                //文字宽度大于屏幕宽度，不适合居中显示
                is_center = false;
            } else {
                //文字宽度小于屏幕宽度，适合居中显示
                is_center = true;
                centerOffset = (self.screenWidth - (spanDomWidth - offsetW)) / 2;
            }


            var t1 = setTimeout(function () {

                spanDom.css({
                    "-webkit-transform": "translateX(" + rightOffset + "px)",
                    "transform": "translateX(" + rightOffset + "px)"
                });
                var t2 = setTimeout(function () {
                    //leftOffset=leftOffset-1200;
                    //aniTime=3;
                    spanDom.addClass("linear_transform_effect");
                    spanDom.css({
                        "visibility": "visible",
                        "-webkit-transition-duration": aniTime + "s",
                        "transition-duration": aniTime + "s",
                        "-webkit-transition-timing-function": "linear",
                        "transition-timing-function": "linear",
                        "-webkit-transform": "translateX(" + (-leftOffset) + "px)",
                        "transform": "translateX(" + (-leftOffset) + "px)"
                    });
                    self._isScrolling=true; //标记正在滚动中
                    spanDom.one("webkitTransitionEnd transitionend", function () {
                        //清除绑定事件
                        spanDom.off("webkitTransitionEnd transitionend");
                        //移除动画类
                        spanDom.removeClass("linear_transform_effect");
                        //移除style样式
                        spanDom.css({
                            "-webkit-transition-duration": "",
                            "transition-duration": "",
                            "-webkit-transition-timing-function": "",
                            "transition-timing-function": ""
                        });
                        //清除定时器
                        window.clearTimeout(t1);
                        window.clearTimeout(t2);
                        //window.clearTimeout(t3);
                        self._isScrolling=false; //标记滚动结束
                        //调用回调函数
                        if (nextFun&&(!(isSpecialEnv&&!self._isTopBarOpen))){
                            nextFun();
                        }
                    });

                }, 150);
            }, 100);
        },

        /**
         * 显示文字，先判断文字是否能显示的下，如果可以就居中，否则靠左显示
         * @param spanDom 文字容器节点
         * @param text 文字内容
         * @return 居中返回ture 否则返回false
         */
        showText: function (spanDom, text,nextFun) {
            if (!spanDom) return;
            var self = this;
            var is_center = false; //是否居中显示
            self.screenWidth = $(document).width(); //文档宽度，需要重新获取一次，以便在横屏时计算正确
            var leadDom='<em class="jieshuo_cover">[解说]</em>'+text;
            if(text.indexOf('解说已开启')>=0){
                leadDom=text;
            }
            spanDom.html(leadDom);
            //偏移值，即以屏幕宽度的偏移，即右边按钮的大小
            var offsetW = 25;
            //非兼容模式下偏移较大
            if (!isSpecialEnv)offsetW = 70;
            var textWidth = spanDom.width();
            //为了确保此处没有动画效果，清除动画有关css属性
            spanDom.removeClass("linear_transform_effect");
            spanDom.css({
                "-webkit-transition-duration": "",
                "transition-duration": "",
                "visibility": "hidden"
            });

            var $jieshuo=$(".jieshuo_cover");
            if($jieshuo.length>0){
                textWidth=textWidth+$jieshuo.width()
            }

            if (textWidth > ((self.screenWidth - offsetW))-20) {
                //文字宽度大于屏幕宽度，不适合居中显示
                is_center = false;

                //文字居左
                spanDom.css({
                    "transform": "translateX(0px)",
                    "-webkit-transform": "translateX(0px)"
                });
            } else {
                //文字宽度小于屏幕宽度，适合居中显示
                is_center = true;

                var offset = (((self.screenWidth-offsetW) - textWidth) / 2)+20;
                //文字居中
                spanDom.css({
                    "transform": "translateX(" + offset + "px)",
                    "-webkit-transform": "translateX(" + offset + "px)"
                });
            }

            return is_center;
        },

        /**
         * 等待指定的时间，并执行指定的回调
         * @param nextFun
         * @param timeOut
         */
        waitFor: function (nextFun, timeOut) {
            var self=this;
            if (!nextFun || !timeOut) return;
            if(isSpecialEnv&&!this._isTopBarOpen) return; //如果置顶解说条未显示则不执行
            self._waitTimer = window.setTimeout(function () {
                //调用回调
                if (nextFun) {
                    nextFun();
                }
                //清楚定时器
                window.clearTimeout(self._waitTimer);
            }, timeOut);
        },

        /**
         * 显示“解说按钮”
         * @param nextFun 淡入动画结束后会调用该回调函数
         */
        showTopBarBtn: function (nextFun) {
            var self = this;
            var aniTime = 200; //动画持续时间
            if (self.$openBarrageBtn.length > 0
                && self.$openBarrageBtn.css("opacity") == "0") {
                self._isStopReceive=true; //“解说”按钮显示时不接受弹幕消息
                //解说按钮存在，并且已经隐藏
                self.$openBarrageBtn.addClass("will_change");
                //设置动画持续时间
                self.$openBarrageBtn.css({
                    "visibility": "visible",
                    "-webkit-transition-duration": aniTime + "ms",
                    "transition-duration": aniTime + "ms"
                });

                //开始动画
                var t = window.setTimeout(function () {
                    //动画结束前接触事件绑定
                    self.$openBarrageBtn.off("click");
                    self.$openBarrageBtn.css({
                        "opacity": "1",
                        "z-index": "2016"
                    });
                    self.$openBarrageBtn.one("webkitTransitionEnd transitionend", function () {
                        //删除绑定事件
                        self.$openBarrageBtn.off("webkitTransitionEnd transitionend");
                        //移除动画类
                        self.$openBarrageBtn.removeClass("will_change");
                        //清楚style样式
                        self.$openBarrageBtn.css({
                            "-webkit-transition-duration": "",
                            "transition-duration": ""
                        });
                        //重新绑定事件
                        self.$openBarrageBtn.on("click", function () {
                            self.hideBtnAndShowTopBar(function () {});
                        });
                        //清除定时器
                        window.clearTimeout(t);
                        //调用回调函数
                        if (nextFun) {
                            nextFun();
                        }
                    });
                }, 30);
            }

        },

        /**
         * 隐藏"解说"按钮
         * @param nextFun
         */
        hideTopBarBtn: function (nextFun) {
            var self = this;
            var aniTime = 100; //动画持续时间
            if (self.$openBarrageBtn.length > 0
                && self.$openBarrageBtn.css("opacity") == "1") {
                self._isStopReceive=false; //开始接收解说弹幕
                //解说按钮存在，并且已经隐藏
                self.$openBarrageBtn.addClass("will_change");
                //设置动画持续时间
                self.$openBarrageBtn.css({
                    "-webkit-transition-duration": aniTime + "ms",
                    "transition-duration": aniTime + "ms"
                });

                //开始动画
                var t = window.setTimeout(function () {
                    //重新绑定事件
                    self.$openBarrageBtn.on("off");
                    self.$openBarrageBtn.css({
                        "opacity": "0",
                    });
                    self.$openBarrageBtn.one("webkitTransitionEnd transitionend", function () {
                        //删除绑定事件
                        self.$openBarrageBtn.off("webkitTransitionEnd transitionend");
                        //移除动画类
                        self.$openBarrageBtn.removeClass("will_change");
                        //清楚style样式
                        self.$openBarrageBtn.css({
                            "visibility": "hidden",
                            "-webkit-transition-duration": "",
                            "transition-duration": "",
                            "z-index": ""
                        });

                        //重新绑定事件
                        self.$openBarrageBtn.on("click", function () {
                            self.hideBtnAndShowTopBar(function () {});
                        });
                        //清除定时器
                        window.clearTimeout(t);
                        //调用回调函数
                        if (nextFun) {
                            nextFun();
                        }
                    });
                }, 30);
            }
        },

        /**
         * 隐藏顶部消息条并显示解说按钮
         * @nextFun 完成隐藏置顶解说条后会调用该回调
         */
        hideTopBarAndShowBtn: function (nextFun) {
            var self = this;
            self._isTopBarOpen=false;
            self.hideTopBar(function () {
                if(nextFun){
                    nextFun();
                }
            });
            self.showTopBarBtn(function () {
            });
        },

        /**
         * 隐藏"解说"按钮并显示顶部消息条
         */
        hideBtnAndShowTopBar: function () {
            var self = this;
            self._isTopBarOpen=true;

            var msg ={};   //= self.isHasNextCommentary();
            self.hideTopBarBtn(function () {

            });
            self.clearMsgAndStopAll();
            //如果点击"解说"按钮时，没有消息
            msg = {
                message: "解说已开启"
            };

            window.clearTimeout(self._waitTimer); //清除可能存在的timer，以免等待事件被以外执行
            self._isProcessing=true;
            if(self.showText(self.$coverTextSpan, msg.message)){
                if( self.$cmt_barrageHostCloseBtn&&
                    self.$cmt_barrageHostCloseBtn.length>0){
                    self.$cmt_barrageHostCloseBtn.hide();
                }
                self.showTopBar(function () {
                });
                self.waitFor(function () {
                    self.processRockText(self.$coverTextSpan);
                }, 5000);
            }else{
                self.showTopBar(function () {
                    self.waitFor(function () {
                        self.processRockText(self.$coverTextSpan);
                    }, 2000);
                });
            }


        },

        /**
         * 显示顶部消息条
         * 先判断顶部消息条是否显示，如果没有显示，则进行显示
         * @param nextFun 显示完成后会触发该回调函数
         */
        showTopBar: function (nextFun) {
            var self = this;
            var aniTime = 500; //动画持续时间，单位为毫秒
            if (self.$cmt_barrageHost_cnt.css("visibility") == "hidden") {
                //如果顶部消息条未显示
                self._isTopBarOpen=true; //标记置顶解说已开启
                //显示解说区域
                self.$cmt_barrageHost.css("visibility", "visible");
                //显示解说区域文字
                self.$coverTextSpan.css("visibility", "visible");
                //显示解说区域文字
                self.$cmt_barrageHost_cnt.addClass("transform_effect");
                self.$cmt_barrageHost_cnt.css({
                    "visibility": "visible",
                    "-webkit-transition-duration": aniTime + "ms",
                    "transition-duration": aniTime + "ms",
                    "z-index":"2016"
                });

                //开始动画显示
                var t = window.setTimeout(function () {
                    self.$cmt_barrageHost_cnt.css({
                        "-webkit-transform": "translateY(0)",
                        "transform": "translateY(0)"
                    });
                    self.$cmt_barrageHost_cnt.one("webkitTransitionEnd transitionend", function () {
                        //删除绑定事件
                        self.$cmt_barrageHost_cnt.off("webkitTransitionEnd transitionend");
                        //移除动画类
                        self.$cmt_barrageHost_cnt.removeClass("transform_effect");
                        //清楚style样式
                        self.$cmt_barrageHost_cnt.css({
                            "-webkit-transition-duration": "",
                            "transition-duration": "",
                        });
                        //清除定时器
                        window.clearTimeout(t);
                        //调用回调函数
                        if (nextFun) {
                            nextFun();
                        }
                    });
                }, 30);

            }
        },

        /**
         * 隐藏顶部消息条
         * @param nextFun 完成淡出动画隐藏顶部消息条后调用该回调函数
         */
        hideTopBar: function (nextFun) {
            var self = this;
            var aniTime = 300; //动画持续时间，单位为毫秒
            if (self.$cmt_barrageHost_cnt.css("visibility") == "visible") {
                //如果顶部消息条已显示
                self._isTopBarOpen=false; //标记关闭置顶解说条
                ////显示解说区域
                //self.$cmt_barrageHost.css("visibility","visible");
                //显示解说区域文字
                self.$cmt_barrageHost_cnt.addClass("transform_effect");
                self.$cmt_barrageHost_cnt.css({
                    //"visibility":"visible",
                    "-webkit-transition-duration": aniTime + "ms",
                    "transition-duration": aniTime + "ms"
                });

                //开始动画显示
                var t = window.setTimeout(function () {
                    var upOffset = self.$cmt_barrageHost_cnt.height() + 5;
                    self.$cmt_barrageHost_cnt.css({
                        "-webkit-transform": "translateY(" + (-upOffset) + "px)",
                        "transform": "translateY(" + (-upOffset) + "px)"
                    });
                    self.$cmt_barrageHost_cnt.one("webkitTransitionEnd transitionend", function () {
                        //删除绑定事件
                        self.$cmt_barrageHost_cnt.off("webkitTransitionEnd transitionend");
                        //移除动画类
                        self.$cmt_barrageHost_cnt.removeClass("transform_effect");
                        //清楚style样式
                        self.$cmt_barrageHost.css("visibility", "hidden");
                        self.$coverTextSpan.css("visibility", "hidden");
                        self.$cmt_barrageHost_cnt.css({
                            "visibility": "hidden",
                            "-webkit-transition-duration": "",
                            "transition-duration": "",
                            "z-index":""
                        });
                        //清除定时器
                        window.clearTimeout(t);
                        //调用回调函数
                        if (nextFun) {
                            nextFun();
                        }
                    });
                }, 30);

            }
        },

        /**
         * 循环输出消息数组里的消息
         * @private
         */
        showHCommentary: function (msgs) {
            isSpecialEnv = ua.weibo || (ua.weixin && !ua.src.match(/MQQBrowser/i)) || ua.chrome || ua.ios;
            var self = this;
            //从消息池中筛选出解说弹幕消息并存入消息堆栈
            for (var i = 0; i <= msgs.length-1; i++) {
                if (msgs[i].position == '5') {
                    var msg = msgs[i];
                    self.pullMessage(msg); //将消息推入消息栈
                }
            }

            self.processAll();
        },

        /**
         * 将消息对象存入消息池(消息对象数组)
         * 丢弃消息池以外的消息
         * @param msg 消息对象
         * @private
         */
        pullMessage: function (msg) {
            return this._msgStack.push(msg);
        },
        /**
         * 从消息池取(消息对象数组)出数据
         * @returns {*} 取出的消息对象
         * @private
         */
        popMessage: function () {
            if (this._msgStack.length > 0) {
                var thisMessage = this._msgStack.shift();
                return thisMessage;
            } else {
                return {};
            }
        }

    };
	module.exports = commentary;
});
