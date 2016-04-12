/**
 * 边看边买逻辑：
 * 1.1分钟走一次板块数据，获得新数据存储起来
 * 2.startTime字段标示是否还用轮询显示商品
 *
 * 优化：
 * 商品展示以后就不用再轮询接口了，同时过滤商品的定时器也不需要了
 * 当接口中返回不用再轮询字段以后，清掉接口轮询定时器，同时当所有商品的结束时间都小于服务器时间的时候就清掉所有定时器
 *
 */
__req('lib::swiper.js');
define(function (require, exports, module) {
    var TimeService = require('comp/TimeService');
    var events = require('./events');
    var Tpl = require('air/util/tpl');
    var ScrollAnimate = require('air/util/scrollTo');
    var tips = require('air/ui/tips');
    var BuyingLooking = {
        /*******************************逻辑入口Start********************************/
        /**
         * 初始化
         */
        init: function (config) {
            this.initDom(config);
            this.initEvent();
            this.initPage();
        },

        /**
         * 初始化dom节点与变量
         */
        initDom: function (config) {
            this.widgetId = config.widgetId;
            this.liveId = config.liveId;
            this.bmbkBlockId = config.bmbkBlockId;
            this.startTime = config.startTime;
            this.localStack = [];
            this.currentGood = null;
            this.isShowing = false;
            this.$videoToolBar = $('#videoToolBar' + config.widgetId);
            this.$toolBarMallBtn = $('#toolBarMallBtn' + config.widgetId);
            this.$toolBarCartNum = this.$toolBarMallBtn.find('.ico_shopTip');
            this.$scrollBox=$('#j-scroller-1');
            // 1分钟轮询一次板块接口60000
            this.doRequestTimeout = 60000;
            // 2秒轮询一次商品，是否还需要轮询字段控制这个轮询2000
            this.filterFoodsTimeout = 2000;
            // 30秒获取一次服务器时间，防止切换窗口定时器停止导致当前时间不准的问题30000
            this.getServerTimeTimeout = 30000;
            this.interfaceToCMS = le.api_host.dynamic_api + '/block/' + (this.bmbkBlockId || '5544') + '.json';
            this.shoppingCartUrl = 'http://newshoppingcart.go.lemall.com/bkbm/bkbmcart/totalcount.jsonp';
            this.addToCardUrl = 'http://newshoppingcart.go.lemall.com/bkbm/bkbmcart/add.jsonp';
            this.getCardCountUrl = 'http://newshoppingcart.go.lemall.com/bkbm/bkbmcart/count.jsonp';
            this.customHide = false;
            this.clickScrollToTopBtn = false;
            this.stopCMSRequest = false;
            this.addToCardBtnClicked = false;
            this.isFirstCome = true;
            //老商品
            this.newCurrentNode = false;
            this.addCurrentClick = false;//展开的点击
            this.firstCurrentNode = false;
            this.SlderImageIndex = 10;//上方的图片的索引
            this.SlderImgIndex = 0;//上方的图片轮换的索引
            this.setImageTimer = null;//上方的图片轮换time
            this.allCurrenNode = [];
            this.oldCurrentSetNode = [];
            //滑动时候 在三星浏览器下会出现卡顿现象
            this.finish=false;
            this._load1='';
            this.heightset=false;
            this.tipshowFlag=true;
        },

        /**
         * 初始化事件
         */
        initEvent: function () {
            events.on('toggleGood', $.proxy(this.toggleGood, this));
            events.on('setBuyLookCartCount', $.proxy(this.setShownCount, this));
            $(document).on('touchmove scroll', $.proxy(this.checkStatusAndShow, this));
            events.on('playerChangeFullscreen', $.proxy(this.hideButton, this));
            $(window).on('ortchange', $.proxy(this.removeAnimateClass, this));

        },

        /**
         * 初始化页面
         * 当停止轮询接口的情况下，同时商品没有符合展示的了以后，可以去掉所有定时器以节省性能
         */
        initPage: function () {
            // 获取服务器时间
            this.getServerTime($.proxy(this.startTicktack, this));
            this.doRequest();
            this.doRequestTimer = window.setInterval($.proxy(this.doRequest, this), this.doRequestTimeout);
            this.filterFoodsTimer = window.setInterval($.proxy(this.filterGoods, this), this.filterFoodsTimeout);
            this.getServerTimeTimer = window.setInterval($.proxy(this.getServerTime, this), this.getServerTimeTimeout);
            this.$videoToolBar.append('<div class="j_buyTipBox buyTipBoxWrapper" ></div><div class="j_buyTipBoxS buyTipBoxS" style="display:none;"></div>');
            this.$buyingLooking = this.$videoToolBar.find('.j_buyTipBox');
            this.$tipToTop = this.$videoToolBar.find('.j_buyTipBoxS');
            this.initDomEvent();
            this.getCardCount();
        },

        /**
         * 结构渲染出来以后我们需要监听结构内的元素点击事件
         */
        initDomEvent: function () {
            var _self = this;
            this.$buyingLooking.on('click', '.j_closebuyinglooking', $.proxy(this.closeToHide, this));
            this.$buyingLooking.on('click', '.j_detail', $.proxy(this.showAnimateAllImage, this));
            this.$buyingLooking.on('click', '.j_addToCard', $.proxy(this.addToCard, this));
            this.$buyingLooking.on('click', '.j_btngood', $.proxy(this.goToDetailPage, this));
            this.$tipToTop.on('click', $.proxy(this.scrollToTop, this));
            this.$buyingLooking.on('webkitAnimationEnd animationend', function (e) {
            if(e.animationName==='ani_fadeInDown'){
              _self.finish=true;
              _self.removeAnimateClass();
              _self.SetSlideMaxHeight();

            }
              if (e.animationName === 'ani_buyTip') {
                    _self.$buyingLooking.removeClass('ani_buyTip');
                } else if (e.animationName === 'ani_buyTipClose') {
                    /*
                     点击后显示展开浮层
                     */

                    if (_self.addCurrentClick) {
                        var $buyTip = $('.buyTipBox_detail');
                        $('.j_detail').hide();
                        $buyTip.show();
                        $('.buyTipBox').hide();
                        _self.$buyingLooking.removeClass('ani_buyTipClose');
                        _self.$buyingLooking.addClass('anim_fadeIndown');
                         _self.SliderToStart();
                          _self.SetSlideMaxHeight();

                    } else {
                        _self.$buyingLooking.removeClass('boxShow');
                    }
                }else if(e.animationName==='ani_buyOpenClose'){
                  _self.$buyingLooking.removeClass('boxShow');

                }
            });
        },
        /*******************************逻辑入口End********************************/

        /*******************************事件处理Start********************************/
        /**
         * 移除动画类
         */
        removeAnimateClass: function () {
            this.$buyingLooking.removeClass('ani_buyTipClose ani_buyTip anim_fadeIndown');
        },

        /**
         * 上放的轮播图开始轮播
         */
        topSliderStart: function () {
          var _self=this;
          var small_len=$('#j-slide-wrapper-1 li').length;
            //轮播插件
            var mySwiper = new Swiper('#j-slide-wrapper-1', {
                effect:'fade',
                observer: true,
                loop:false,
                observeParents: true,
                autoplay: 5000
            });
            _self._load1='small';
            for(var i=0;i<small_len;i++){
                _self._loadImg(i,_self._load1);
            }
        },
        /**
         * 上放的轮播图结构
         */
        getTopSlderHtml: function (htmlJson) {
            this.SlderImageIndex = 10;
            var topSlider = '<div id="j-slide-wrapper-1" class="swiper-container-android"><ul class="swiper-wrapper">';

            for (var i = 0; i < htmlJson.length; i++) {
                topSlider += '<li class="swiper-slide"><img src="http://i3.letvimg.com/lc07_img/201604/08/17/57/temp.png" /><i data-src="' + htmlJson[i] + '" /></li>';
            }
            topSlider += '</ul>';
            topSlider += '</div>';
            return topSlider;
        },

        getSlderHtmlNone:function(){

                var SliderOneHtml='<div class="btBox_isopen_img"><img class="default_logo" src="http://i3.letvimg.com/lc07_img/201604/08/17/57/temp.png"></div>';
                return SliderOneHtml;
        },
        getSlderHtml: function (htmlJson) {
            var SliderTouchHtml = '<div class="btBox_isopen_wrapper">' +
                '<ul id="j-scroller-1" class="btBox_isopen_img">';

            for (var i = 0; i < htmlJson.length; i++) {
                SliderTouchHtml += '<li><img src="http://i3.letvimg.com/lc07_img/201604/08/17/57/temp.png"><i data-src=' + htmlJson[i] + '></i></li>';
            }
            SliderTouchHtml += '</ul>';
            SliderTouchHtml += '</div>';
            return SliderTouchHtml;

        },

        _loadImg: function (index,elem) {

            this._Img = LTK.require('components.img_load');
            this._lisa ='';
            if(elem==='small'){
              this._lisa=$('#j-slide-wrapper-1 li i');
            }else{
              this._lisa=$('#j-scroller-1 li i');
            }
            var self = this,
                cur = this._lisa.eq(index),
                img = cur.attr('data-src');
            if (!img) return;
            self._loading = true;
            this._Img(img, function () {
                cur.css('background-image', 'url(' + img + ')');
                cur.attr('data-src', '');
                self._loading = false;
            }, true);
        },

        SliderToStart: function () {
            var _self = this;

            if(_self.finish===true){
              // _self.SetSlideMaxHeight();
              _self.removeAnimateClass();

            }
            var loadImg_num=$('#j-scroller-1 li').length;
            for (var i = 0; i < loadImg_num; i++) {
                _self._loadImg(i,_self.lazy_elem1);
            }

        },
        SetSlideMaxHeight:function(){
          // var maxLen=$('#j-scroller-1 li').height();
          window.setTimeout(function(){
            $('#j-scroller-1').css({
              // maxHeight:parseInt(maxLen)+'px',
              '-webkit-overflow-Scrolling':'touch'
            });
          },0);
        },

        /**
         * 跳转详情页
         */
        goToDetailPage: function (e) {
            var $this = $(e.currentTarget);
            this.packSendAction({
                lid: this.liveId,
                ap: 'ch=live&pg=diy&bk=bmbk&link=evaluate',
                nextLocation: $this.attr('data-href')
            });
        },

        /**
         * 展开轮播图
         */
        showAnimateAllImage: function () {
            this.addCurrentClick = true;
            this.$buyingLooking.addClass('ani_buyTipClose');
            this.packSendAction({
                ap: 'ch=live&pg=diy&bk=bmbk&link=detailClick'
            });
        },

        /**
         * 滚动到顶部逻辑
         */
        scrollToTop: function () {
            var _self = this;
            this.clickScrollToTopBtn = true;
            this.hideButton();
            ScrollAnimate(0, 100);
            setTimeout(function () {
                _self.clickScrollToTopBtn = false;
            }, 150);
        },
        /*******************************事件处理End********************************/

        /*******************************工具函数Start********************************/
        /**
         * 检查是否需要显示新商品快抢购按钮
         */
        checkStatusAndShow: function () {
            if (!this.$buyingLooking || this.clickScrollToTopBtn) {
                return;
            }
            // if (!this.isShowing||window.orientation == 90 || window.orientation == -90||!this.tipshowFlag) {
            if (!this.isShowing||window.orientation == 90 || window.orientation == -90) {
                this.$tipToTop.hide();
                return;
            }else{
              var offset = this.$buyingLooking.offset();
               var buyTipheight=$('.buyTipBox').offset().height;
              if(offset.height===0){
                   offset.height=buyTipheight;
              }         
              var currentTop = (offset.top + offset.height) - $('body').scrollTop();
              if (currentTop > 0) {
                  if (!this.tipToTopShow) {
                      return;
                  }
                  this.hideButton();
              } else {
                  if (this.tipToTopShow) {
                      return;
                  }
                  this.showButton();
              }
            }

        },


        /**
         * 隐藏“新商品，快抢购”按钮
         */
        hideButton: function () {
            this.$tipToTop.hide();
            this.tipToTopShow = false;
        },

        /**
         * 显示“新商品，快抢购”按钮
         */
        showButton: function () {
            this.$tipToTop.show();
            this.tipToTopShow = true;
        },

        /**
         * 服务器时间肯定不是实时去取，获取到以后通过定时器来同步时间
         * 开始计秒
         */
        startTicktack: function () {
            var _self = this;
            this.ticktackTimer = window.setInterval(function () {
                _self.serverTime += 1000;
            }, 1000);
        },

        /**
         * 获取服务器时间
         */
        getServerTime: function (callback) {
            var _self = this;
            TimeService.get(function (time) {
                _self.serverTime = time * 1000;
                callback && callback.call(_self);
            });
        },

        /**
         *
         **/
        getStartNodeTime: function (x, y) {
            return (x.startTime < y.startTime) ? 1 : -1;
        },

        /**
         * 过滤商品，在页面上展示
         * 首先当前商品要变成null，这样才能存新的商品
         * currentItem.startTime === 0 || currentItem.endTime === 0 || currentTime === 0
         * 如果开始时间\结束时间\服务器时间有任意一个为0,说明编辑填写的时间有问题,这个时候商品不展示
         */
        filterGoods: function () {
            //停止 请求 让商品先消失再出现
            if (this.newCurrentNode) {
                this.newCurrentNode = false;
                return;
            }

            var _self = this;
            this.allCurrenNode = [];
            var currentTime = this.serverTime || 0;
            this.currentGood = null;
            for (var i = 0; i < this.localStack.length; i++) {
                var currentItem = this.localStack[i];
                if (currentItem.startTime === 0 || currentItem.endTime === 0 || currentTime === 0) {
                    continue;
                }
                if (currentTime < currentItem.startTime || currentTime > currentItem.endTime) {
                    continue;
                } else {
                    this.allCurrenNode.push(currentItem);
                }
            }
            this.allCurrenNode.sort(_self.getStartNodeTime);

            if (this.allCurrenNode.length) {//出现新的 则变新的无论展开还是没有
                if (!this.firstCurrentNode) {
                    this.firstCurrentNode = true;
                    this.currentGood = this.allCurrenNode[0];
                } else {
                    if (this.oldCurrentSetNode[0] === undefined) {
                        this.firstCurrentNode = false;
                    } else {
                        this.allCurrenNode[0].startTime != this.oldCurrentSetNode[0].startTime ? this.newCurrentNode = true : this.currentGood = this.allCurrenNode[0];
                    }
                }
            } else {
                //如果展开了,则不收回。
                if (_self.addCurrentClick) {
                    return;
                }
            }

            this.oldCurrentSetNode = this.allCurrenNode;
            events.emit('toggleGood');
        },
        /**
         * 展示商品
         * 当前时间点存在与某个商品展示时间段内
         */
        toggleGood: function () {
            if (this.currentGood) {
                if (this.newCurrentNode) {//出现新商品的时候
                    this.hideConstructor();
                }
                else {
                    this.displayConstructor();
                }
            } else {
                this.hideConstructor();
            }
        },

        /**
         * 发送请求
         */
        doRequest: function () {
            this.startRequest($.proxy(this.formatData, this));
        },

        /**
         * 格式化数据
         */
        formatData: function (block) {
            if (!block) {
                return;
            }
            if (!block.blockContent || block.blockContent.length === 0) {
                return;
            }
            // 下边判断的逻辑是：如果得到的数据中startTime为0，则停止商品的轮询
            if (block.startTime == '0') {
                this.destoryBuyingLooking();
                return;
            }
            var formatedContent = null;
            // 每次遍历数据都获取最新的数据放到本地存储里
            this.localStack.length = 0;
            for (var i = 0; i < block.blockContent.length; i++) {
                formatedContent = this.formatContent(block.blockContent[i]);
                this.localStack.push(formatedContent);
            }
            // 第一次得到商品后要走一次过滤，不管什么时候，保证实效性
            if (this.isFirstCome) {
                this.filterGoods();
                this.isFirstCome = false;
            }
        },

        /**
         * 销毁所有时间定时器
         */
        destoryBuyingLooking: function () {
            window.clearInterval(this.doRequestTimer);
            window.clearInterval(this.filterFoodsTimer);
            window.clearInterval(this.getServerTimeTimer);
            window.clearInterval(this.ticktackTimer);
            window.clearInterval(this.setImageTimer);
            this.doRequestTimer = null;
            this.setImageTimer = null;
            this.filterFoodsTimer = null;
            this.getServerTimeTimer = null;
            this.ticktackTimer = null;
            this.hideConstructor(true);
        },

        /**
         * 格式化需要的数据，不需要的不用存储
         * content      对应直播id
         * title        商品标题
         * subTitle     商品id
         * shorDesc     商品简介
         * remark       商品价格
         * tagUrl       商品原价
         * url          商城详情url
         * pic1         商品图片（104×104）
         * startTime    出现时间点（自然时间）
         * endTime      隐藏时间点（自然时间）
         * position     商品类型
         *
         * 格式化以后的数据格式为：
         * liveId       对应直播id
         * name         商品标题
         * id           商品id
         * desc         商品简介
         * price        商品价格
         * tagUrl       商品原价
         * url          商城详情url
         * pic          商品图片（104×104）
         * startTime    出现时间点（自然时间）
         * endTime      隐藏时间点（自然时间）
         * type         商品类型
         * picAll       商品图片
         */
        formatContent: function (content) {
            var formatedObj = {
                liveId: content.content,
                name: content.title,
                tag: content.tag,
                id: content.subTitle,
                picCurrentArr: this.setTopPicToArr(content.picList),
                picAll: this.setPicArrNode(content.picList),
                desc: content.shorDesc,
                price: content.remark,
                url: content.url,
                pic: content.pic1,
                startTime: this.getTimestamp(content.startTime),
                endTime: this.getTimestamp(content.endTime),
                startTimeOri: content.startTime,
                tagUrl: content.tagUrl,
                endTimeOri: content.endTime,
                type: content.position
            };

            return formatedObj;
        },
        /**
         *把后台传过来的上方浮层商品图片代码的转换成数组
         *
         */
        setTopPicToArr: function (arr) {
            var startPicArr = [arr['pic1'], arr['pic2'], arr['mobilePic']];
            var truePicArr = [];
            for (var i = 0; i < startPicArr.length; i++) {
                if (startPicArr[i]) {
                    truePicArr.push(startPicArr[i]);
                }
            }
            return truePicArr;
        },

        /**
         *把后台传过来的商品图片代码的转换成数组
         *
         */
        setPicArrNode: function (arr) {
            var startPicArr = [arr['tvPic'], arr['400x250'], arr['960x540'], arr['1440x810'], arr['400x300']];
            var truePicArr = [];
            for (var i = 0; i < startPicArr.length; i++) {
                if (startPicArr[i]) {
                    truePicArr.push(startPicArr[i]);
                }
            }
            return truePicArr;
        },

        /**
         * 根据时间字段获取时间戳
         * 这样做的目的是在比较时间的时候通过时间戳能容易比较大小
         */
        getTimestamp: function (timeStr) {
            var timeStamp = Date.parse(timeStr.replace(/-/g, '/'));
            if (!timeStamp) {
                return 0;
            } else {
                return timeStamp;
            }
        },

        /**
         * 获取时分格式字符串
         */
        getHHmm: function (timeStr) {
            var timeStamp = Date.parse(timeStr.replace(/-/g, '/'));
            var date = new Date(timeStamp);
            return (date.getHours() + '' + date.getMinutes());
        },

        /**
         * 在页面上展示商品DOM结构
         * 浮层曝光
         */
        displayConstructor: function () {
            var id = Cookie.get('lastAddedGoodId');
            if (!this.isShowing && !this.customHide) {
                if (id == (this.currentGood.id + '' + this.currentGood.startTime)) {
                    return;
                }
                // 让用户可以点击
                this.addToCardBtnClicked = false;
                this.$toolBarMallBtn.addClass('cur');
                this.$buyingLooking.html(this.getGoodPriceTpl());
                this.$buyingLooking.removeClass('ani_buyOpenClose ani_buyTipClose').addClass('ani_buyTip boxShow');
                this.addShopPeople();
                this.isShowing = true;
                this.checkStatusAndShow();
                this.packSendAction({
                    acode: '41',
                    ap: 'ch=live&pg=diy&bk=bmbk&link=explorer'
                });
                this.loadImg(this.$buyingLooking);
                this.topSliderStart(this.allCurrenNode[0].picCurrentArr);
                $('img[data-src]').imglazyload();
            }
        },

        /**
         *
         * @param $container
         */
        loadImg: function ($container) {
            $container.find('img[data-src]').each(function () {
                var $img = $(this);
                $('<img />').bind('load', function () {
                    $img.attr('src', $img.attr('data-src'));
                }).attr('src', $img.attr('data-src'));
            });
        },

        /**
         * 在页面上隐藏商品DOM结构
         *
         * 当点击关闭按钮或者加入购物车以后关闭浮层
         * 但是这里要注意的是这个不能吧isShowing变为false，否则15秒之内还会再显示出来
         */
        hideConstructor: function (customHide) {
            var _this = this;
            this.customHide = !!customHide;
            if (this.isShowing) {
                if (_this.addCurrentClick) {
                    _this.addCurrentClick = false;
                    this.$buyingLooking.removeClass('showAll_img').addClass('ani_buyOpenClose');
                }
                else {
                    this.$buyingLooking.addClass('ani_buyTipClose');
                }
                this.$toolBarMallBtn.removeClass('cur');
                this.isShowing = false;
                this.checkStatusAndShow();
            }
            this.$buyingLooking.addClass('ani_buyTipClose');
        },

        /**
         * 获取Dom结构
         * 格式化以后的数据格式为：
         * liveId       对应直播id
         * name         商品标题
         * id           商品id
         * desc         商品简介
         * price        商品价格
         * url          商城详情url
         * pic          商品图片（104×104）
         * startTime    出现时间点（自然时间）
         * endTime      隐藏时间点（自然时间）
         * type         商品类型
         * tag          好评度
         */
        getGoodPriceTpl: function () {
            var _self = this;
            if (!this.currentGood) {
                return '';
            }
            //  好评字段
            var tplStr =
                '<div class="buyTipBox" >' +
                    '<dl class="j_detail">' +
                        '<dt>' +
                            ' <p class="icon_font buyTip_attention">' +
                            ' <span><em></em><em>/人关注</em></span></p>' +
                            '{topHtml}' +
                        '</dt>' +
                        '<dd>' +
                            '<p class="intro_title">{name}</p>' +
                            '<p class="intro_subtitle">{desc}</p>' +
                            '<span class="buyTip_price">{price}</span>' +
                            '<span class="buyTip_price_before">{tagUrl}</span>' +
                        '</dd>' +
                    '</dl>' +
                    '<div class="buyTipBox_btn">' +
                        '<a class="buyTip_shopping j_addToCard j_outBtn" data-id="{id}" data-start="{startTime}" id="j-shopping" href="javascript:;" data-type="{type}">加入购物车</a>' +
                    '</div>' +
                    '<a class="ico_close j_closebuyinglooking j_finish">' +
                        '<i class="icon_font icon_close"></i>' +
                    '</a>'  +
                '</div>' +
                '<div class="buyTipBox_detail" style=" display:none; ">' +
                    '{SlderHtml}' +
                    '{goodItem}'+
                    '<div class="buyTip_shoping_wrapper">' +
                        '<span class="buyTip_price">{price}</span>' +
                        '<span class="buyTip_price_before">{tagUrl}</span>' +
                        '<a class="buyTip_shopping j_addToCard" data-id="{id}" data-start="{startTime}" data-type="{type}">加入购物车</a>' +
                    '</div>' +
                    '<a class="ico_close j_closebuyinglooking"><i class="icon_font icon_close"></i></a>' +
                    '<em class="ico_arrowdown j-arrowdown">' +
                        '<i class="icon_font icon_tarr"></i>' +
                    '</em>'+

                '</div>';

            var tpl = new Tpl(tplStr, function (item, i) {
              if(item.tag){
                item.goodItem='<a class="j_btngood btn_good icon_font icon_chao" data-href="'+_self.currentGood.url+' "><em>'+_self.currentGood.tag+'</em>好评</a>' ;
              }
              if(_self.currentGood.picAll.length===0){
                 item.SlderHtml= _self.getSlderHtmlNone();
                } else {
                 item.SlderHtml = _self.getSlderHtml(_self.currentGood.picAll);
                }

                    item.topHtml = _self.getTopSlderHtml(_self.currentGood.picCurrentArr);
         

            });
            return tpl.render(this.currentGood);
        },

        /**
         * 展示提示
         * @param msg
         */
        showTips: function (msg) {
            tips({
                html: '<div class="tipBoxWrapper"><div class="tipsBox">' + msg + '</div></div>',
                autoClose: 1500,
                hideFn: function () {
                    this.$box.hide();
                }
            });
        },

        /**
         * 添加购物车成功
         */
        addToCardSuccess: function (id) {
            Cookie.set('lastAddedGoodId', id, {exp: 'forever'});
            this.showTips('添加成功');
            this.getCardCount();
        },

        /**
         * 关注人数获取成功
         */
        addShopPeopleSuccess: function (people) {
            people > 10000 && (people = (people / 10000).toFixed(1) + '<i>万<i/>');//如果超过万则保留1位;
            $('.buyTip_attention em').first().html(people);
        },

        /**
         *关注人数获取失败
         */
        addShopPeopleError: function () {
            $(".buyTip_attention").detach();
        },

        /**
         * 点击关闭按钮
         */
        closeToHide: function () {
            this.tipshowFlag=false;
            this.packSendAction({
                ap: 'ch=live&pg=diy&bk=bmbk&link=close'
            });
            this.delayToHide();
        },

        /**
         * 延时隐藏商品浮层
         * @param timeout 延迟时间
         */
        delayToHide: function (timeout) {
            var _self = this;
            window.setTimeout(function () {
                _self.hideConstructor(true);
            }, timeout || 0);
        },

        /**
         * 展示购物车数量
         * 这里需要将购物车商品数量通过info下的cartCount来保存，用来判断购物车商品数量
         */
        setShownCount: function (count) {
            if (isNaN(count) || count === 0) {
                return;
            }
            window.info.cartCount = count;
            this.$toolBarCartNum.addClass('showShopNum');
            if (count > 50) {
                this.$toolBarCartNum.html('50+');
            } else {
                this.$toolBarCartNum.html(count);
            }
        },
        /*******************************工具函数End********************************/


        /*******************************接口请求Start******************************/
        /**
         * 开始进行请求
         * @param blockId 板块ID
         */
        startRequest: function (callback) {
            var _self = this;
            $.ajax({
                url: this.interfaceToCMS,
                cache: false,
                data: {
                    platform: 'msite'
                },
                dataType: 'jsonp',
                success: callback || function () {
                },
                error: function () {
                    _self.doRequestTimeout *= 2;
                    if (_self.doRequestTimer) {
                        window.clearInterval(_self.doRequestTimer);
                        _self.doRequestTimer = window.setInterval($.proxy(_self.doRequest, _self), _self.doRequestTimeout);
                    }
                }
            });
        },

        /**
         * 购买人数的数据请求
         *
         */
        addShopPeople: function () {
            var _self = this;
            $.ajax({
                url: this.shoppingCartUrl,
                cache: false,
                data: {
                    cpsid: this.liveId,
                    startingtime: this.getHHmm(this.startTime),
                    duration: '5'
                },
                dataType: 'jsonp',
                success: function (res) {
                    if (res.status == '1') {
                        if (res.result) {
                            _self.addShopPeopleSuccess(res.result.cartTotalCount);
                        }
                        else {
                            _self.addShopPeopleError();
                        }
                    }
                },
                error: function () {
                    _self.addShopPeopleError();
                }
            });
        },

        /**
         * 将商品添加到购物车
         * 点击上报
         */
        addToCard: function (e) {
            if (this.addToCardBtnClicked) {
                this.delayToHide();
                return;
            }
            this.addToCardBtnClicked = true;
            var $this = $(e.currentTarget);
            var _self = this;
            var type = $this.attr('data-type');
            var id = $this.attr('data-id');
            var startTime = $this.attr('data-start');
            var arrivalId = '1';
            var userId = 0;
            if (le.m.isLogin()) {
                userId = $.cookie('ssouid');
            }

            if ($this.hasClass('j_outBtn')) {
                this.packSendAction({
                    ap: 'ch=live&pg=diy&bk=bmbk&link=addtocardClick'
                });
            } else {
                this.packSendAction({
                    ap: 'ch=live&pg=diy&bk=bmbk&link=inadd'
                });
            }

            var params = {
                purType: type || '1',
                pids: id,
                needCartDetail: '0',
                deviceid: Stats.getLC(),
                user_id: userId,
                arrivalId: arrivalId,
                cpsid: this.liveId,
                rs: '12'
            };

            if (!le.m.isLogin()) {
                params.tokenid = Stats.getUUID();
            }

            $.ajax({
                url: this.addToCardUrl,
                cache: false,
                dataType: 'jsonp',
                data: params,
                success: function (res) {
                    if (res.status == '1') {
                        _self.addToCardSuccess(id + '' + startTime);
                    } else if (res.status == '300') {
                        _self.showTips('购物车已满，请及时处理');
                    } else if (res.status == '302') {
                        _self.showTips('该商品数量已添加至上限');
                    } else {
                        _self.showTips('添加失败，请再试试~！');
                    }
                    _self.delayToHide();
                }
            });
        },

        /**
         * 上报代码逻辑
         * acode:上报类型
         * lid:直播id
         * ap:ap字段
         * @param config
         */
        packSendAction: function (config) {
            var id = '0';
            if (this.currentGood) {
                id = this.currentGood.id;
            }
            Stats.sendAction({
                acode: config.acode || '0',
                lid: config.lid || this.liveId,
                ap: config.ap + '&goodsid=' + id
            }, config.nextLocation);
        },

        /**
         * 获取购物车商品数量
         */
        getCardCount: function () {
            var userId = 0;
            var deviceid = Stats.getLC();
            if (le.m.isLogin()) {
                userId = $.cookie('ssouid');
                deviceid = 0;
            }
            $.ajax({
                url: this.getCardCountUrl,
                dataType: 'jsonp',
                cache: false,
                data: {
                    user_id: userId,
                    deviceid: deviceid
                },
                success: function (res) {
                    if (res.status == '1') {
                        // 购物车数量为0或者返回数据有问题则不执行操作
                        if (!res.result || isNaN(res.result.cartItemCount)) {
                            return;
                        }
                        events.emit('setBuyLookCartCount', res.result.cartItemCount);
                    }
                }
            });
        }
        /*******************************接口请求End********************************/
    };
    module.exports = BuyingLooking;
});
