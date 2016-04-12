/**
 * @fileoverview 2015 图文直播挂件
 * @authors liuxiaoyue3@letv.com
 * @date 20150910
 */
__req('lib::gmu/zepto.imglazyload.js');
define(function(require,exports,module){
    var picShow = require('./picSlide');
    var events = require('./../events');
    var share = require('./../share/share_base');
    var baseShare = require('components/share/share_base');
    var tips = require('air/ui/tips');
    var TimeService = require('comp/TimeService');
    var isShift = require('../isShift');
    var thousand = require('air/string/thousand');
    require('../share/hideShareLayer');
    var $ = Zepto;
    var scrollLoadmore = require('air/util/scrollLoadmore');
    var getFormattedTime = require('air/util/getFormattedTime');
    var ua = require('air/env/ua');
    var InterfaceErrorTip = require('components/interfaceErrorTip');


    var utils = {
        formateHM : function(time){
            var arr = time.split(' ');
            var hm = arr[1].split(':');
            var unit = 1;
            var tm = parseInt(hm[0],10);
            if( tm > 12){
                unit = 0;
                hm[0] = hm[0] - 12;
            }
            if(tm === 12){
                unit = 0;
            }
            return (unit ? '上午' : '下午') + hm[0] + ':' + hm[1];
        }
    };

    var comp;
    var TEXT = {
        nil : '直播员都激动得说不出话了...请稍候~',
        err : '糟了，网线被挖掘机铲走了，攻城狮已经去追了！'
    };

    function picTextLiveDirComp(args){
        this.liveId = args.id;
        this.root = args.wrapEl;
        this.liveBeginTime = args.liveBeginTime;
        this.livePagePicTextOrder = args.livePagePicTextOrder;
        if(!this.root.length){
            return;
        }

        //如果是在通用直播页，则需要替换展位图
        var bgImgUrl='http://i3.letvimg.com/lc04_img/201601/07/17/18/img16V9.png';
        if(info.pageid&&info.pageid==='live/play'){
            bgImgUrl='http://i2.letvimg.com/lc05_img/201603/09/15/57/img16V9.png';
        }

        this.TPL = [
            '{{#list}}',
            '<div class="graphic">',
                '<dl class="graphic_cnt">',
                    '<dd class="graphic_img {{#picOneFlag}}graphic_img_one{{/picOneFlag}}">',
                        '{{#picList}}',
                            '<a href="javascript:;" {{#onePicHref}}data-href="{{url}}"{{/onePicHref}} k-name="send-click-stat" data-click-stat="ch=live&pg=play&bk=pictextlive&link=bigpic">',
                                '<span>',
                                    '<img src="'+bgImgUrl+'" data-url="{{picUrl}}">',
                                    '<small data-origin="{{prefix}}" data-url="{{picUrl}}"></small>',
                                '</span>',
                            '</a>',
                        '{{/picList}}',
                    '</dd>',
                    '<dt><span>{{showTime}}<span><span></span></span></span></dt>',
                    '<dd class="graphic_txt">{{{description}}}</dd>',
                    '<dd class="graphic_ico">',
                        '<a href="javascript:;" class="ico_zan" id="0050000_live_{{id}}">',
                            '<span>',
                                '<i class="icon_font icon_zan1"></i>',
                                '<div class="zan_num">',
                                    '<ul>',
                                        '<li></li>',
                                        '<li></li>',
                                    '</ul>',
                                '</div>',
                            '</span>',
                        '</a>',
                        '<a href="javascript:;" class="ico_share1" time="{{shareTime}}" id="{{id}}">',
                            '<span>',
                                '<i class="icon_font icon_share1"></i>',
                                '<b class="arrow_top"></b>',
                            '</span>',
                        '</a>',
                    '</dd>',
                '</dl>',
                '<div class="shareBox1">',
                    '<b class="arrow_top"></b>',
                    '<div class="share_cnt">',
                        '<ul>',
                            '<li class="ico_weixin" data-type="weixin" style="display:none;"><a href="javascript:;"><i class="icon_font icon_weixin"></i><span>微信</span></a></li>',
                            '<li class="ico_qq" data-type="qzone"><a href="javascript:;"><i class="icon_font icon_qone"></i><span>QQ空间</span></a></li>',
                            '<li class="ico_weibo" data-type="weibo"><a href="javascript:;"><i class="icon_font icon_sina"></i><span>新浪微博</span></a></li>',
                        '</ul>',
                    '</div>',
                '</div>',
            '</div>',
            '{{/list}}'
        ].join('');

        this.TITLE = [
            '<dl class="intro">',
                '<dt>'+ (args.activityTitle || '') +'</dt>',
                '<dd class="intro_txt">'+ (args.activityDesc || '') +'</dd>',
            '</dl>'
        ].join('');

        //是否是时移分享页面
        this.shiftData = isShift();
        //新数据最后更新时间
        this.modifyTime = '';
        //请求完成状态
        this.requestDoneFlag = false;
        //3分钟自动刷新定时器
        this.autoRefreshtimer = '';
        //分页存储当前id数
        this.pageNumId = '';

        //滚动加载数据到达最后一页
        this.stopScrollLoadFlag = false;

        this.init();
    }
    picTextLiveDirComp.prototype = {
        init : function(){

            if(this.shiftData.is && this.shiftData.id){
                this.renderOneContent();
            }else{
                this.renderContent();
            }
            this.initBindEvent();
        },
        initBindEvent : function(){
            var root = this.root;
            var that = this;
            new picShow({
                el : root
            });
            var errBtn = root.find('#picTextError');
            // errBtn.on('click', _.bind(that.errorRequest,this, root));
            //绑定分享 赞
            root.delegate('.ico_share1', 'click', _.bind(this.initShareFunc,this));
            root.delegate('.ico_zan', 'click', _.bind(this.initLikeFunc,this));
            //绑定 微博 微信 qq空间
            root.delegate('.ico_weibo', 'click', _.bind(this.weiboShare,this));
            root.delegate('.ico_weixin', 'click', _.bind(this.weixinShare,this));
            root.delegate('.ico_qq', 'click', _.bind(this.qqShare,this));
            if(this.shiftData.is){
                root.delegate('.look_all', 'click', _.bind(this.renderContent,this));
            }
            root.delegate('.shareBox1', 'touchstart click', function(e){
                e.stopPropagation();
            });
            events.on('hidePicTextShareLayer', function(){
                that.hideAllShareLayer();
            });
        },
        renderContent : function(){
            var that = this;
            that.openTimer(that.root);
            that.request(that.root,'first');
            if(that.shiftData.is){
                // that.root.find('.no_loading').hide();
                that.root.find('.loadBox').show();
                that.root.find('.js_con').html('');
                that.root.find('.look_all').hide();
            }
        },
        renderOneContent : function(){
            this.requestOneData();
        },
        initShareFunc: function(e){
            e.preventDefault();
            e.stopPropagation();
            var el = $(e.target).closest('.ico_share1');
            //找到点击节点 对应的分享浮层
            var shareBox = el.closest('dl').next();
            share.init(el,shareBox,'',this.liveBeginTime);
            events.emit('hideToolShareLayer');
        },
        initLikeFunc : function(e){
            var that = this;
            var el = $(e.target).closest('.ico_zan');
            if(el.attr('doneZan') === '1'){
                tips({
                    html : '<div style="width:100px; padding:6px; background-color:#000; position:fixed; color:#fff; opacity:0.8; font-size:14px; border-radius:5px; text-align:center;">您已赞过</div>',
                    autoClose: 1000,
                    hideFn: function () {
                        this.$box.hide();
                    }
                });
            }else{
                el.attr('doneZan','1');
                el.addClass('cur');
                //解决“点赞之后横屏，再从横屏旋转回到竖屏，已经点过赞的点赞数样式问题”
                $elZan=el.find('.icon_font');
                //$elZan.addClass('ani_shou');
                //$elZan.one('animationend webkitAnimationEnd',function(){
                //    $elZan.removeClass('ani_shou');
                //});

                //在通用直播播放页上报通用直播播放页，否则沿用diy上报
                if(info.pageid&&info.pageid==='live/play'){
                    Stats.feStat({code: 'like-tw'});
                    Stats.sendAction({ap: 'ch=liveplay&pg=live&bk=pictext&link=zanclick'});
                }else{
                    Stats.feStat({code: 'like-tw'});
                    Stats.sendAction({ap: 'ch=live&pg=diy&bk=pictext&link=zanclick'});
                }
                //不管接口请求是否成功，动画效果都添加
                if(!el.attr('isAni')){
                    $elZanUl=el.find('ul');
                    $elZanUl.addClass('ani_up');
                    $elZanUl.addClass('zancai_ok');
                    $elZanUl.one('animationend webkitAnimationEnd',function(){
                        $elZanUl.removeClass('ani_up');
                    });
                }
                TimeService.update(function (time) {
                    $.ajax({
                        url: le.api_host.hd_my + '/action/incr',
                        type: 'get',
                        data: {
                            id: el.attr('id'),
                            sign: that.getSign(time)
                        },
                        dataType: 'jsonp',
                        success: function (res) {
                        }
                    });
                });
            }
        },
        initScrollLoad : function(){
            var that = this;
            var box = this.root.find('.js_con');
            new scrollLoadmore({
                offsetBottom:100,
                $box : box,
                onScrollUp : function(){
                    that.request(that.root, 0 , 1, 0);
                }
            });
        },
        weiboShare : function(){
            //在通用直播播放页上报通用直播播放页，否则沿用diy上报
            if(info.pageid&&info.pageid==='live/play'){
                Stats.sendAction({ap: 'ch=liveplay&pg=live&bk=pictextshare&link=weiboclick'});
                Stats.feStat({code: 'share', scode: 'wb'});
                Stats.feStat({code: 'share1', scode: 'tuwen'});
            }else{
                Stats.sendAction({ap: 'ch=live&pg=diy&bk=pictextshare&link=weiboclick'});
                Stats.feStat({code: 'share', scode: 'wb'});
                Stats.feStat({code: 'share1', scode: 'tuwen'});
            }

            //实现分享功能
            baseShare.otherShare('weibo');
        },
        weixinShare : function(){
            if(info.pageid&&info.pageid==='live/play'){
                Stats.sendAction({ap: 'ch=liveplay&pg=live&bk=pictextshare&link=weixinclick'});
            }else{
                Stats.sendAction({ap: 'ch=live&pg=diy&bk=pictextshare&link=weixinclick'});
            }

            //实现分享功能
            baseShare.weixinShare('diyWeixin');
        },
        qqShare : function(){
            if(info.pageid&&info.pageid==='live/play'){
                Stats.sendAction({ap: 'ch=liveplay&pg=live&bk=pictextshare&link=qqclick'});
                Stats.feStat({code: 'share', scode: 'qq'});
                Stats.feStat({code: 'share1', scode: 'tuwen'});
            }else{
                Stats.sendAction({ap: 'ch=live&pg=diy&bk=pictextshare&link=qqclick'});
                Stats.feStat({code: 'share', scode: 'qq'});
                Stats.feStat({code: 'share1', scode: 'tuwen'});
            }

            baseShare.otherShare('qzone');
        },

        /**
         * 只有定时器不存在同时倒序排序的时候才回每分钟取一次数据问题
         * @param wrap
         */
        openTimer : function(wrap){
            var that = this;
            if(!this.autoRefreshtimer && this.livePagePicTextOrder !== '1'){
                this.autoRefreshtimer = setInterval(function(){
                    that.request(wrap, 0, 0, 1);
                },60000);
            }
        },
        closeTimer : function(){
            if(this.autoRefreshtimer){
                clearInterval(this.autoRefreshtimer);
                this.autoRefreshtimer = '';
            }
        },
        hideAllShareLayer : function(){
            if(!ua.superLetvClient){
                this.root.find('.graphic').css('zIndex',1);
                this.root.find('.shareBox1').removeClass('fadeDown').hide();
            }
            this.root.find('.ico_share1').removeClass('cur');

        },
        /**
         * 请求图文数据接口
         * @param config
         * wrap: 根元素
         * first: 区分是否第一次请求 此参数主要用来判断第一次数据获取失败
         * scrollLoad: 滚动加载分页展示数据  主要区分分页获取数据传递参数不一样
         * timer 实时刷新获取数据  主要区分实时刷新参数不一致
         */
        request : function(wrap,first,scrollLoad,timer){

            var params;
            var that = this;
            if(that.requestDoneFlag){
                return;
            }
            that.requestDoneFlag = true;
            //第一次进来刷新数据
            params = 'liveCode='+ this.liveId +'&platform=1006&pageSize=20';

            //实时刷新
            if(timer){
                params = 'liveCode='+ this.liveId +'&platform=1006&pageSize=20&newFlag=1&lcId=' + that.modifyTime;
            }
            //滚动加载
            if(scrollLoad){
                //此处应该添加判断 若已经没有数据了，则不需要再次请求接口
                if(that.stopScrollLoadFlag){
                    return;
                }
                if(info.pageid&&info.pageid==='live/play'){
                    Stats.feStat({code: 'tw-scroll'});
                    Stats.sendAction({ap: 'ch=liveplay&pg=live&bk=pictextscrollload&link=scrollload'});
                }else{
                    Stats.feStat({code: 'tw-scroll'});
                    Stats.sendAction({ap: 'ch=live&pg=diy&bk=pictextscrollload&link=scrollload'});
                }

                params = 'liveCode='+ this.liveId +'&platform=1006&pageSize=20&newFlag=0&lcId='+that.pageNumId;
            }
            
            $.ajax({
                //url: 'http://10.154.252.56:28080/live/get?'+ params +'&callback=?',
                url: le.api_host.static_api + '/live/get?'+ params +'&callback=?',
                dataType: 'jsonp',
                data:{
                    order: this.livePagePicTextOrder
                },
                success: function(res){
                    if(res && res.code === 200 && res.data){
                        var list = res.data.list;
                        //此处添加判断条件，区分是否第一次请求
                        if(first){
                            that.render(wrap,res.data,'allfirst');
                            if(list.length < res.data.totalCount){
                                that.initScrollLoad();
                            }
                        }else{
                            var pos;
                            if(scrollLoad){
                                pos = 'append';
                            }
                            if(timer){
                                pos = 'prepend';
                            }
                            if( list && list.length > 0){
                                that.render(wrap,res.data,'add',pos);
                            }
                            if((!list || list.length === 0)&& scrollLoad){
                                //只有一条数据 下拉加载更多 隐藏
                                wrap.find('.js_con').find('.loadBox1').hide();
                                that.stopScrollLoadFlag = true;
                            }
                        }
                    }else{
                        if(first){
                            that.requestFailure(wrap,'all');
                        }
                    }
                    that.requestDoneFlag = false;
                },
                error : function(res){
                    if(first){
                        that.requestFailure(wrap,'all');
                    }
                    that.requestDoneFlag = false;
                }
            });
        },
        /**
         * 请求图文直播单条数据详情接口
         */
        requestOneData : function(){
            var that = this;
            $.ajax({
                // url: 'http://10.154.252.56:28080/live/getLiveContent?id='+ this.shiftData.id,
                url: le.api_host.static_api + '/live/getLiveContent?id='+ this.shiftData.id,
                dataType: 'jsonp',
                success: function(res){
                    if(res && res.code === 200 && res.data){
                        var wrapData = {
                            list : []
                        };
                        wrapData.list.push(res.data);
                        that.render(that.root, wrapData,'onefirst');
                        that.root.find('.look_all').show();
                    }else{
                        that.requestFailure(that.root, 'one');
                    }
                },
                error : function(res){
                    that.requestFailure(that.root, 'one');
                }
            });
        },
        /**
         * 渲染数据 插入内容
         * @param config
         * wrap: 根元素
         * data: 模版渲染数据
         * type: 此参数存在 表明不是第一次获取数据 而是追加数据
         * pos : append  上拉加载数据
         *       prepend  自动刷新获取数据
         */
        render : function(wrap,data,type,pos){
            var that = this;
            var tpl = Hogan.compile(that.TPL);
            var formateData = that.formateJson(data,type,pos);
            var hml = tpl.render(formateData);
            //数据内容重新包层，是因为单条数据获取成功后，错误处理代码被删了 所以包一层
            var wrapper = wrap.find('.js_con');
            wrapper.show();
            if(type === 'add'){
                //滚动加载
                if(pos === 'append'){
                    wrapper.append(hml);
                    wrapper.find('.loadBox1').hide();
                }
                //实时刷新
                if(pos === 'prepend'){
                    // wrapper.prepend(hml);
                    wrapper.prepend('<div data-js="wrap">' + hml + '</div>');
                    var jsWrap = $(wrapper.find('[data-js="wrap"]')[0]);
                    that.newDataAnimation(jsWrap);
                    //第一次进来数据获取失败 自动刷新获取内容 首先要隐藏状态
                    that.root.find('.no_loading').hide();
                }
            }else{
                wrapper.html(hml);
                this.renderActivityRule(wrapper);
            }
            $('img[data-url]').imglazyload();
            that.root.find('.look_all').hide();
            that.root.find('.loadBox').hide();

            //准备投票数据
            that.requestVote(formateData.ids);
            that.requestDoneFlag = false;
        },
        /**
         * 请求图文直播投票数据接口
         */
        requestVote : function(ids){
            var that = this;
            if(ids){
                $.ajax({
                    url: le.api_host.hd_my + '/action/num?id='+ ids.join(','),
                    dataType: 'jsonp',
                    success: function(res){
                        if(res && res.code === 200 && res.data){
                            that.renderVoteNum(res.data);
                        }
                    },
                    error : function(res){
                    
                    }
                });
            }
        },
        /**
         * 开始渲染投票数据接口
         */
        renderVoteNum : function(data){
            var that = this;
            for( var i in data){
                var lis = $('#' + i).find('li');
                var voteObj = that.formatlikeCount(data[i]);
                if(voteObj.flag){
                    $(lis[0]).html(voteObj.count ? voteObj.count : '');
                    $(lis[1]).html(voteObj.count + 1);
                }else{
                    $(lis[0]).html(voteObj.count);
                    $(lis[1]).html(0);
                    $('#' + i).attr('isAni','1');
                }
            }
        },
        /**
         * 渲染活动规则
         */
        renderActivityRule : function(wrap){
            if(!this.shiftData.is){
                wrap.prepend(this.TITLE);
            }
        },
        /**
         * 自动刷新获取数据需要一条一条展示效果方法 后期会添加动画效果
         */
        newDataAnimation : function(wrap){
            var blocks = wrap.find('.graphic');
            blocks.hide();
            // blocks.css({
            //     'opacity':'0'
            // });
            // $.each(blocks,function(idx, im){
            //     var hg = $(im).height();
            //     $(im).attr('data-height',hg);
            // });
            // blocks.hide();
            // blocks.css({
            //     'height':'0px'
            // });
            blocks = Array.prototype.slice.call(blocks).reverse();
            var flag = 0;
            var updateTimer = setInterval(function(){
                if(flag === blocks.length){
                    clearInterval(updateTimer);
                    return;
                }
                var curr = $(blocks[flag]);
                curr.show();
                // curr.css({
                //     'height': curr.attr('data-height') + 'px'
                // });
                // curr.on('webkitTransitionEnd TransitionEnd', function(){
                //     curr.css({'opacity':1});
                //     curr.off('webkitAnimationEnd animationend');
                // });
                flag++;
            },1200);
        },
        /**
         * 第一次获取数据发生异常错误处理
         */
        requestFailure : function(wrap,type){
            wrap.find('.loadBox').hide();
            wrap.find('.js_con').hide();
            var that = this;
            if (this.interfaceErrorTip) {
                this.interfaceErrorTip.showTip();
            } else {
                this.interfaceErrorTip = new InterfaceErrorTip();
                this.interfaceErrorTip.init({
                    'container': wrap,
                    'callback': function(){
                        that.requestDoneFlag = false;
                        that.errorRequest(wrap,type);
                    }
                });
            }
            if(type === 'one'){
                this.switchTab = 'one';
            }else if(type === 'all'){
                this.switchTab = 'all';
            }
        },
        /**
         * 针对异常 点击获取内容
        */
        errorRequest : function(el, type){
            //点击查看全部内容 第一次获取失败
            if(this.shiftData.is && type === 'one'){
                this.requestOneData();
            }else if((this.shiftData.is && type === 'all')){
                // el.find('.no_loading').hide();
                el.find('.loadBox').show();
                this.request(el,'first');
            }else{
                el.find('.loadBox').show();
                this.request(el,'first');
            }
        },
        /**
         * 接口返回数据格式化处理
         */
        formateJson : function(json,type,pos){
            var that = this;
            var obj = $.extend(json,{});
            if(obj.list && obj.list.length > 0){
                obj.ids = [];
                $.each(obj.list, function(index, item){
                    //此处方便测试 新增数据时间传递倒数第三条数据 上线的时候 index应该为0
                    if(index === 0 && (type === 'allfirst'||  pos === 'prepend')){
                        that.modifyTime = item.id;
                    }
                    if(index === (obj.list.length - 1)){
                        that.pageNumId = item.id;
                    }
                    if(!item.url){
                        item.url = 0;
                    }
                    // item.showTime = '2015-10-22 17:46:34';
                    item.shareTime = getFormattedTime(item.showTime);
                    item.showTime = utils.formateHM(item.showTime);
                    item.picList = that.pushImgList(item);
                    if(item.picList.length === 1){
                        item.picOneFlag = 1;
                    }
                    if(item.picOneFlag && item.url){
                        item.onePicHref = 1;
                    }
                    obj.ids.push('0050000_live_' + item.id);
                    //投票数特殊处理
                    // var voteObj = that.formatlikeCount(item.voteCount);
                    // if(voteObj.flag){
                    //     item.voteOrigin = voteObj.count ? voteObj.count : '';
                    //     item.voteNew = voteObj.count + 1;
                    // }else{
                    //     item.voteOrigin = voteObj.count;
                    //     item.voteNew = 0;
                    // }
                });
            }
            return obj;
        },
        /**
         * 图文直播 图片数据格式化处理
         */
        pushImgList : function(obj){
            var list = ['pic_1','pic_2','pic_3','pic_4'];
            var picList = [];
            var len = parseInt(obj.style,10);
            var defauObj;
            if(len===1){
                defauObj = {
                    url : '/thumb/2_640_360.jpg',
                    flag:1
                };
            }else{
                defauObj = {
                    url : '/thumb/2_320_180.jpg',
                    flag:0
                };
            }
            for(var i = 0; i < len; i++){
                picList.push({
                    picUrl : obj.picJson[list[i]] + defauObj.url,
                    prefix : obj.picJson[list[i]],
                    flag : defauObj.flag
                });
            }
            if(picList.length === 0){
                picList = 0;
            }
            return picList;
        },
        /**
         * 获取签名
         * @param time0
         * @returns {*}
         * @private
         */
        getSign: function (time0) {
            eval(eval((function (h8, P2, I8) {
                return eval('(' + h8 + ')("' + P2 + '","' + I8 + '")');
            })("\u0066\u0075\u006e\u0063\u0074\u0069\u006f\u006e\u0028\u0073\u002c\u0074\u0029\u007b\u0066\u006f\u0072\u0028\u0076\u0061\u0072\u0020\u0069\u003d\u0030\u002c\u006b\u003d\u0027\u0027\u002c\u0066\u003d\u0066\u0075\u006e\u0063\u0074\u0069\u006f\u006e\u0028\u006a\u0029\u007b\u0072\u0065\u0074\u0075\u0072\u006e\u0020\u0070\u0061\u0072\u0073\u0065\u0049\u006e\u0074\u0028\u0074\u002e\u0073\u0075\u0062\u0073\u0074\u0072\u0028\u006a\u0025\u0028\u0074\u002e\u006c\u0065\u006e\u0067\u0074\u0068\u0029\u002c\u0032\u0029\u002c\u0031\u0036\u0029\u002f\u0032\u003b\u007d\u003b\u0069\u003c\u0073\u002e\u006c\u0065\u006e\u0067\u0074\u0068\u003b\u0069\u002b\u003d\u0032\u0029\u007b\u0076\u0061\u0072\u0020\u0064\u003d\u0070\u0061\u0072\u0073\u0065\u0049\u006e\u0074\u0028\u0073\u002e\u0073\u0075\u0062\u0073\u0074\u0072\u0028\u0069\u002c\u0032\u0029\u002c\u0031\u0036\u0029\u003b\u006b\u002b\u003d\u0053\u0074\u0072\u0069\u006e\u0067\u002e\u0066\u0072\u006f\u006d\u0043\u0068\u0061\u0072\u0043\u006f\u0064\u0065\u0028\u0064\u002d\u0066\u0028\u0069\u0029\u0029\u003b\u007d\u0072\u0065\u0074\u0075\u0072\u006e\u0020\u006b\u003b\u007d", "ded5df8c8f95cea29cdca3d1d2e1d1e3db945edae2c6e6967999ac95a1aa9b986d969a9eb9a7579fac9598a2a4b1678b9cdda7ad57a2979de0a5a0986d909a9cada9739598a790aba29a6193a08eb29e5edba4a294a69f9a6d98b1979db566949da79faba99d658da5aaa6b5569ca69b9ca7b29d618fe496d8dc9197a7a6a0d69ed09688a695ecaa659f979de0a9a09865d7a2969db565969d9e9badb29765999e96a2ab6694b49f94e49fa95dc5e1d3d7ea97d2dd95dba599bf6988e7dbd5e84ea7a2aa8a9699dc6a9c949ea9a46696a3b299a09fa16395b1979db25694a79b98a5b297678b9cdda9d957a2979de0a6a39869919a97a7bb618ca995a0ac999cad92a48eb2b35697a39998eca1a45e9e9496aca25edba3d091ae95a06a8da098b9a95a9898a990a6a59865d7a1959db55694a29b99a7a0b1678bd2c6e0e9938ca99598ec9ecd618fe497ac9f69ccd595dba59bd89acdd3d9dcb45693e7a09aa0a4a56393b1969db26b8ba19b9bb99e9865d79f979db55695a299a0aa9b9e6e96b1969db05696a29b94ab9d9a6b97a3aaa49f6a8ba1a696a69fa57a8f9895eca85e8cae9598eca2a26194a393adbb599498a790a4e5a1678b9cdda9aa579fa2a296a5a29d7a91ab95ecd9688b9fe598a09de466c195a19ca6a697a3999ca296ab5d93a493a6bb608f9fe59da996a665d7a1999ddc9dd597e3c9e68dd96b9c9497a7a464a8a09998ec9ecd5e9d9495ecab668fa39e96a7a2a27a8f95a4aaa96893e79f9cb2a49c6390a49bb9a76d93e79f9eae959d668d9899a5a457a1979de0a69f9865d79fc69db55edba3a5a2a69f9a6a97b197b2b356939da1ad9f9f9866909a8eb39e5edba49d94a4e5d05e99949ca7a4669cb49f94a4e5d05e9ba59ea2a85f9cb4a0a79ca2a16391b197a0a86091a59da0b99e956f87a29aa2a25f949da49aacb29d5e9da09aa2ac61a8a0ac90ad9d9a6ba49c91a4ee5f9c98a798eca09c70cca2a3a5b157a7a298a59cdda172cfa1a49ca76191a1b29ba09ea06396b1959db4569ca49b94a4e59e6588ab8da9a95a94a696a29ca19e6394a1aaa5a2629a98aba59ca2a56394a4aaa7a25edba59f91b3959cad969895eca8618ca995a0ad9ba17a909897a2aa739598ab90a5a29868929a9ca6a7738ea196a7a4e59d65999496a5a25f9398ab98eca2a174879cdddaa2649c98a790a9a09a6aa49e91a4ee619898aba59ca29c6391a198b9a75a9aa19b91b395a3678b9cdda7ae579d979de0a9a09865d79e989db4569ba29b9db99f986b989a9aabbb618cae9598eca2d061959d939db05693e7a0caa0a5a17a8a9f8eb2b35697a89b9bb99e9869939a9ea5bb5f8caed3c9e0e0d16f879cddaaa2639498a990a4e59d998b9cdda8d957a2a4a696aca1b16799949da5a4679ab49899a0a1a56394b1989db05693e79e9aa09de469c195a1b1a76491a09f99b99dab6a929a9da7bb619d979e98a2a3b1688ba48eb2b361969da09fa7b29c7487a593a0a76191a7a0ad9f9f956f879cddaaa95a93e7a1ce9dab9e6e8d9d9bb9a76d8b9fe599a599a16e8da39eacbb608ca99598eca39d618fe498d89f6c8b9fe59cda999e688da49dabbb5f8cae9598ec9e9c618fe49ad69f6893e7a0cab2aa9465d7a19ba0a6a69698acdce6e2d16f8fe496a5b26b8ba49ba1b9989c618fe49aac9f6d8b9fe59bd699a2678da599b9a8579d979e98a2a4b1688ba197a2aa67a8a096a6b1959e6d8d989baca457a297a39ea2a2b1678b9cdda8d9579da19b98a7b29e5e9edf96a2d996c4e1aedc9cdaa25e998ea5999f93cce3d4919ce1b0accd8e93d7de8fd5b0e190e1a3996288a7d7d9eaa3d5dd8dbba8aaa972cde1d1e0b593d9d0d990b8a0956fb2a0c3e7a7ab8c978fc7ad95d989c49a8ed9d74ec8978f949ca69d63949daa9fa65a93e79f9f9dab946b939898a8a4659bb49e91b3959f6a8d9c96b9a85a9c9f9b91ae9de4989ba98da6a65a9ca49b91b3959cad939f91e2eb9acf98a7a1a2a69e66a49ca19ca6a698a39998eca0cd5e9e9499aaa46599b49e94aca69a68a49e8eaea76291a0a29eb9989d739c9495eca7678f9fe59ad696ab5d909f93a0ad6091a8a1a0b9989d5e999495eca9938fa69f96a99fb16688aaa29ca96091a0a4ada6999cad93a58eb39e62969da2ad9f9e9865d79f9a9db05698a1999fab969570d1d1d9e9e89cdebaa5a2dae2da98d3d5d4e29e9a9698e8ded5df8ca99598bda6b35699a19b98a9a3b1678ba0959db26b8b9fe59bab99a5688d95a4a4ee5e9d9fe59ca4a9a95d8fe4c6a0a6a694d396a79ca59f6390b195a0a6a694a396a29ca4a0638b9cdda8a757a1ac9598eca09f61919a96b9a857a2979de0a79f9865d7a09e9db056959da09cb99f986b979a96b9a857a1979de0a5d39865d7a1999db56794a99598ec9fa2618fe4979db26b8ba2a496a4a6a57a909895ecaa608caea596a5b29d6f87a19ea2a763a8a099a1a69ba26ea497989da29994acb89eb2dd9e61b6a3a0dae5a08baac59ab0d99f63cbd1d3dbea969e98e8bfabaa94a5c0ded8d9bf9cd797d99ba2d0d496d1add99cce608c9b959da69b9f7a8f989ba4a46794a8b293a696a872879cddd5a25edba49e91b3959cad909f91a4ee938ca99598eca1cd61959e939db2569a9d999ea59ba07a9295a4a4ee5f93a9959da69ba268a49d91adaa579f97a19da09de4689395a4a4ee63c5a9959ba79b9d7a929896a4bb608cabaa90aa9d9a6ba49f91a4ee60c498ac90a4e59d988b9f9da2a7609cb49e91ae959cad91a191aca75c95a5a5ada796aa7287a099a2ac60a8a19998ec9ea05e9e9d9ca2a967a8a1a798ec9f955e8de0d4c7eaa0ccddd4909c9de469c19895eca957a1aca09ab3959cad93d091a9a65c94a4b293a796a65d8fe499aaa25f989da19cb99e957387a399a2a7738ea1999eac9b9574879f9ca2a873959b9de0a696a65d96a493a9ad73939b9de0a79e9573939ca49ca8668f9fe59dd996a66a939aa3b1ac5ca2979de0aa9d986b939a95a9bb599598a790a7a49a6da49d91a4ee668cab95a1ad9ba466a49c91a4ee619b98ac90a4e59d6d8ba29ea2ad5e9ab49e91ae95a07a8a9d91a4ee5f939896a3e8a3a98d919790b1b35693e7a09ea09de466c095a1b1a6a6c6aea59faea3a2639da995ecaa8fa2a29f96aea59f7387a298a2aa738ea19998eca39c5e9e949ab9a85a9ca39b91ae95a56b8d989aa4a460a89a9d91b2aa9d678da5aaa6b55695a29b9bb9989e6197a593a9bb599398a7a1ac9ba56796b197b0b35f949da59aa5b29e74919c9faba66a93e7a0a0b39ea2638fa3aaa5b05693e7d094a4e59c5e9ec39ca2d996c4e1aedc9cc4a363cbd1d3dbea969097a19da2a29d6ba49f91a4ee918cadaa9dad9bab5d93a291a4ee649698a790a6a59a6ca49d91a4ee619798a9a5a4e59d679e9cdda8ab689ba69ba6b19de46693ab95eca7688ba49d96a6a4a47a8f989aa79f579de3a3c6cba49a98c7cdd7b5ea56baa69bd4d9dbd3a9c7998dabac5c99a3a3ada6999cad91ce8eb29e629c9d9eada6999e6a8d9c9dabbb608caea49aa2a7946c949a99a5a873959ba3969dab94698f9a99aabb618fa6a6969daca46c8d9d98b9a15e9d979de0a6a49866a497979db26b8b9fe59bd6999cad939e8eb39e5edba09f94a6a39a6ea49e8eae9e5edba4d194aca29a6695b1979db45699a29b94a9a19574879cddaba25edba096a2aa9ba16993b190a69fabd5d4e1dde6db8ca995ab86dfa768cea0eae5f196945e9ae2c6e6969d99e5aae3d3a7d2aacdcfd9dde59c8bdc99ae9de8de9ad3e1d7e2969ba0acb3e5a0d4a69bd4dac8e8df9dd197da94ba96e7a7c4e0dae6e44ed0abb3e5a0b2a69bd4dac8e8df9dd197da94ba96e7a7c4e0dae6e44ed0adb3e5a0bfa69bd4dac8e8df9dd197da94ba96e7a7c4e0dae6e44ed0adabaef199e06fc5e1d3d7ea97d2dd95d5a0b395b0d1d1d9e9e89c83dc8ea5b1b3e961d4a6cbe9e491d7d8dcd69cda987b88e7d7d9eaa3d5dd8dd5d2b3e961c2a6cbe9e491d7d8dcd69cda987b88e7d7d9eaa3d5dd8dd59ab3e961c3a6cbe9e491d7d8dcd69cda987b88e7d7d9eaa3d5dd8dd5b1aaa97bdc98ddaedca3d1d2e1d1e3db94a28bb28eefe893d7e4dfd694daa871a5e991d6b094d8ddd0dcdddcda5dcc98ab9df1a0c8e3e2dae28dd9569cb2e2a0e668c9e4dbcbe8d6dba387d991ba9fa9d5d4e1dde6db8ca284b2e2a0c968c9e4dbcbe8d6dba387d991ba9fa9d5d4e1dde6db8ca28cb2e2a0cd68c9e4dbcbe8d6dba387d991ba9fa9d5d4e1dde6db8ca2dbb2e2f1b194d8ddd0dcdddcda55d2d5cce29ea28ceae3c9e68dcb669cc69bd6a4799b978f98d58f957481b187ae98a0c4ddd1d7e18f989491a987e8e581d7e1d6d6db8f989492a987e0db9ccae3d58aa0cca072818e91d3ab6b85b48f94d3a3a957be8e91d3ad6b85d2d5c9e6aee0579ae2c6e696a0a0dfcedae7d2b5a3d3949baca46098b49fa4b19de4699e9cdda5d7688b9fe59dd6999cad92a58eb2b35698a69b94a6a29a66a49f8eb39e5f959da19bb99d9865d79d959db05edba0a0a69c9de46b919897a6a4659ca2b29a9dac9465d7a19ba0a95f91a5a3ada596a65d8fe499ada2669a9da198abb29e5e9ba98d96d5508f9fe59ca696ab5d81b187a0a7678ca99598eca29c618fe49ad59f6c8ba0a396a8a4a17a90989ba8a463a89aa091b3a5a46399a298b2b356989da6ada699a46c8d9d9aa5bb618cae959dab9b986895959f9ca6a699a0999da69b9f6e96b1989db26b8ba09f96aba6a17a91989ba7a46794b49e91b39de46699949aa8a2659b9da6ada596a872959d93a5a77393ae9e9ca2a0b167999495eca85a93e79e91b09de46992ab8da4ee609b9b9de0a5a09e6c91a5cad6dc5f8ca99de0a99fa86a979aa4ada46893e79e98b2aa9469939a98aaa973959b9de0a6d0957487a19ca2a660a8a19998ec9fd15e999495ecab8f8f9fe599a7969682c0e0cdcfd55fc0979693a6a09a6a93a3aaa5b26b93e79e9eb39de46698a68da8aa5c94a2b29aa09de468c495a39ca6a694d0999eac9ba56d97b1979db5649aa99de0a5a0aa72879e9ea2a662a89a9d94a7a4957487a599a2a25edba49e91ae95a06ea49e91a4ee619598a990a4e59c61929d8eb39e63939d9f9cb99e9867909a9aa7ad739498a790ac9f9a6aa49d91aca4649ab49e91b0aa946b979a91a4ee5f9398ac90a79d9a6a929faaa6a2649a9da5ada596a65d92a593a4ae738ea1999aaa9ba07a9195a1b19e5edba1d394a7a29a65959daaa49f6d8ba29d96adb29c618fe49ba49f688ba79f94ada39a6893b190a69f6aa097a396a09de4689695a49ca6a6989b9de0a796a667989a9cb9a76a8b9fe59aa09de4669595a49ca6a696a49998ecd3956f989c93aaab738ea2a9a5a69b9c6d92b190a6b566999da099b99fa665d79d9db2b35693e7a194a4e5d05e9e9495ecab638f9fe59ba6a3a168969dc6d59f688b9fe599d7999cadc595a3b1a962a2979de0a599a06c8da19ab9a7579d979e9da2a3a57a929898aba460a89f9691a0dba9a5c0ded8d9bf9cd797e191a0cea9a5c0ded8d9bf9cd797a392c1cee09dbacb96d19e578ea196a3e297a9968bdaa2e2d18d95cc9591a0cea996bacb97d19e578fe1aadacfcc9e92879591e2a16bc4aad3d7e695e296d18cd4b1e489c2a2ca94d9aacb698bd3a2a5a296a09fa8d7aae3c79494c98de3a2968caad5939f96db6bd5c7c4aad356cb94d494a496925b87d190b1e889c2a6ca90dc9cd35e8898ca9fb39cbecea4c59cd59570d1d1d9e9e89c83d4ea", "d0e8dad86abed8cae8ec5cc6deda")));
            return sign(time0);
        },
        /**
         * 格式化投票数：
         * ①万以下显示具体数字
         * ②万以上，亿以下，显示“ X.X- XXXX.X 万”，保留小数点后1位
         * ③亿以上显示“ X.X 亿”，保留小数点后1位
         *
         * @param count 投票数 整数
         */
        formatlikeCount: function (count) {
            var formateObj = {};
            if (parseInt(count, 10) >= 0) {
                if (count < 10E3) {
                    formateObj.count = count;
                    formateObj.flag = true;
                } else if (count >= 10E3 && count < 10E7){
                    formateObj.count = (count / 10E3).toFixed(1) + '万';
                    formateObj.flag = false;
                } else if(count >= 10E7){
                    formateObj.count = (count / 10E7).toFixed(1) + '亿';
                    formateObj.flag = false;
                }
            }
            return formateObj;
        }
    };

    events.on('requestPicTextLive',function(opt){
        var picTextWrap = $('#picTextWrap_' + opt.widgetId);
        if(picTextWrap.length === 0 || !picTextWrap.hasClass('active')){
            return;
        }
        var args = {
            wrapEl : picTextWrap,
            // id : '2020151019102359' || opt.liveId,
            id : opt.liveId,
            activityTitle : opt.liveTitle,
            activityDesc : opt.eventDesc,
            liveBeginTime : opt.orignConfig.liveBeginTime,
            livePagePicTextOrder: opt.orignConfig.livePagePicTextOrder || '0',
        };
        if(!comp){
            //初始化实例
            comp = new picTextLiveDirComp(args);
        }else{
            //根据查看全文按钮是否全部显示 来启动定时器 获取数据
            var allBtn = picTextWrap.find('.look_all');
            //查看全文按钮 存在第一次请求失败隐藏 和 全部图文请求失败隐藏
            if(allBtn.css('display') === 'none' && (comp.switchTab === 'all' || !comp.switchTab)){
                //请求接口
                comp.request(picTextWrap, 0, 0, 1);
                comp.openTimer(picTextWrap);
            }
        }

        if(info.pageid&&info.pageid==='live/play'){
            Stats.sendAction({
                acode: '41',
                ap: 'ch=liveplay&pg=live&bk=tab&link=pictextlive'
            });
        }else{
            Stats.sendAction({
                acode: '41',
                ap: 'ch=live&pg=play&bk=tab&link=pictextlive'
            });
        }


    });
    events.on('stopPicTextLive',function(){
        if(comp){
            comp.closeTimer();
        }
    });
});