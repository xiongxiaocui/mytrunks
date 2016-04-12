/*
## 直播播放页聊天信息弹幕 selina
*/
__req('lib::hogan/hogan.js');
define(function(require, exports, module){
    //单条聊天信息tpl
    var tpl =Hogan.compile([
        '<dl class="cmt_info1 {{#isStar}}cmt_infoStar{{/isStar}}{{#isHost}}cmt_infoHost{{/isHost}}">',
        '{{#user}}<dd class="cmt_img"><img src="{{icon}}">{{#isStar}}<i class="icon_font icon_collect"></i>{{/isStar}}</dd>{{/user}}',
        '<dd class="cmt_cnt">{{#isHost}}<i class="icon_font icon_huatong"></i>{{/isHost}}{{{message}}}</dd>',
        '</dl>'].join(''));

    var events = require('../events');
    var LivePlayer = require('diy/diyModules/livePlayer');//需要检测播放器播放状态
    events.on('stopBubbleChat', function(){
        if( bubbleChat && bubbleChat._init ){
            bubbleChat._stopBubble();
        }
    });
    events.on('startBubbleChat', function(){
        bubbleChat._startBubble();
    });
    var BufferMsgArr = require('./buffer_msg');//缓存池中消息
    var bubbleChat = {
        isOpen: true,
        _movement: 0,
        _cur: 0,
        _items: [],
        _init: false,
        _totalNum: 0,
        _timeout: 1500,
        _hideTimeout: 30 * 1000,
        _firstTime: true,
        init: function( widgetId ){
            if(this._init) return;
            this._widgetId = widgetId;
            this._init = true;
            this._initDom();
            this._initEvent();
        },
        _initDom: function(){
            var widgetId = this._widgetId;
            //这里修改为默认不显示
            var html = '<div class="cmt_barrage"><div class="cmt_barrage_box" id="j-bubble-wrapper-' + widgetId +'"></div></div><div id="j-bubble-chat-'+widgetId+'" class="ico_barrage" style="display:none"><i class="icon_font icon_barrage"></i></div>';
            if(!this._bubbleBtn){
                $('body').append(html);
            };
            this._bubbleBtn = $('#j-bubble-chat-' + widgetId);
            this._bubbleWrapper = $('#j-bubble-wrapper-' + widgetId);


            this._ortWatchTab();

        },

        /**
         * 控制在非默认聊天室Tab时才显示弹幕按钮
         * 并且控制在旋转屏时判断是会否在非聊天室TAB页
         * @private
         */
        _ortWatchTab:function(){
            //获取当前激活的tab，只在非聊天室tab下才显示弹幕按钮

            var _self=this;

            var active_tab=$('#tabNav_' + this._widgetId+ ' li.active');
            if(active_tab.attr('id').indexOf('chatToomTab')==-1){
                _self._bubbleBtn.show();
            }

            //需要监听手机屏幕旋转的情况进行控制是否显示
            $(window).on('orientationchange', function() {

                if(window.orientation==180||window.orientation==0){
                    events.emit('stopBubbleChat');
                    events.emit('stopRenderLiveChat');
                }

                if(active_tab.attr('id').indexOf('chatToomTab')==-1){
                    _self._bubbleBtn.show();
                }else{
                    _self._bubbleBtn.hide();
                }
            });
        },

        _initEvent: function(){
            //开关按钮，点击控制聊天弹幕开启/关闭
            this._bubbleBtn.on('click', _.bind(this._toggleBubble, this));
            //当聊天室里请求了最近的历史后，这里同步开启渲染
            events.on('renderBubbleChat', _.bind(this._startRender, this));

        },
        _toggleBubble: function( e ){
            e.preventDefault();
            if( this.isOpen ){
                this.isOpen = false;
                this._stop();
                this._hideEl( this._bubbleWrapper );
                this._bubbleBtn.find('i').removeClass('icon_barrage').addClass('icon_barrage_no');
            }else{
                this.isOpen = true;
                this._showEl( this._bubbleWrapper );
                this._start();
                this._bubbleBtn.find('i').removeClass('icon_barrage_no').addClass('icon_barrage');
            }
        },
        _tempMsgArr:[],
        _startRender: function( e ){
            if(window.info.playerErr&&window.info.playerErr){
                //播放器出错的时候不初始化弹幕，并关闭已打开的弹幕
                events.emit('stopBubbleChat');
                return;
            }

            this._firstTime && Stats.feStat({code: 'chat-diy', scode: 'startRender'});
            var _this = this;
            if( !this.isOpen ) return;
            this._message = BufferMsgArr[0];
            if( this._message ){
                this._showEl(this._bubbleWrapper);
                this._render();
                if(this._hideTimer){
                    clearTimeout( this._hideTimer );
                    this._hideTimer = null;
                }
                this._firstTime && Stats.feStat({code: 'chat-diy', scode: 'hasBubble'});
            }else{
                this._stop();
                this._hideTimer = setTimeout(function(){
                    _this._hideEl( _this._bubbleWrapper );
                }, _this._hideTimeout );
                this._firstTime && Stats.feStat({code: 'chat-diy', scode: 'noBubble'});
                return;
            }
            // if(!e){
            //     _this._animate();
            // }
            this._firstTime = false;
            this._start( e );
        },
        _render: function(){
            //this._bubbleWrapper.append( $el = $( '<li>'+BufferMsgArr.shift().message + '</li>') );
            this._bubbleWrapper.append( $el = $( tpl.render(this._formatData( this._message ) ) ) );
            this._items.push($el);
            $el.css('opacity',0)
        },
        _formatData: function(json){
            //表情符号
            var icons = {
                ':D': 'http://i2.letvimg.com/lc01_img/201509/21/11/55/1152/icon_03.png',
                ':)': 'http://i3.letvimg.com/lc01_img/201509/21/11/55/1152/icon_01.png',
                ':O': 'http://i3.letvimg.com/lc01_img/201509/21/11/55/1152/icon_04.png',
                ':(': 'http://i2.letvimg.com/lc01_img/201509/21/11/55/1152/icon_02.png',
                ':*': 'http://i3.letvimg.com/lc01_img/201509/21/11/55/1152/icon_05.png'
            },
            reIcon = /\[([^\[\]]*)\]/gi;
            //替换其他端快捷输入的表情
            json.message = json.message.replace(reIcon,function(m1,m2){
                return icons[m2] ? '<img src="' + icons[m2] + '"/>' : m1;
            });
            //json.user.role =2;
            json.isStar = json.user.role == 1 ? 1 : 0;
            json.isHost = json.user.role == 2 ? 1 : 0;
            json.isHost && (json.user.icon = 'http://i3.letvimg.com/lc05_img/201601/11/14/37/1436/icon_letv.png');
            return json;
        },
        _start: function( e ){
            var _this = this;
            //var timeout = e ? this._timeout : 0;
            var timeout = this._timeout;
            this._timer = setTimeout(function(){
                if( _this._items[_this._cur] ){
                    _this._animate();
                }
                // if(_this._cur >=100){
                //     _this._remove();
                //     _this._cur = 0;
                // }

                BufferMsgArr.shift();
                _this._startRender( true );
             }, timeout);
        },
        _stop: function(){
            if(this._timer){
                clearTimeout(this._timer);
                this._timer = null;
            }
        },
        _remove: function(){
            this._stop();
            if(this._hideTimer){
                clearTimeout( this._hideTimer );
                this._hideTimer = null;
            }
            if (this._items) {
                this._items.forEach(function(e) {
                    e.remove()
                });
                this._items = []
            }
            this._movement = 0;
            this._cur = 0;
            var el = this._bubbleWrapper[0];
            var t = el.style.webkitTransition;
            el.style.webkitTransition = "none";
            el.style.opacity = 1;
            el.style.webkitTransform = "translateY(0)";
            setTimeout(function() {
                el.style.webkitTransition = t
            }, 0)
        },
        _animate: function(){
            var curItem =  this._items[this._cur];
            if(curItem){
               this._showEl(curItem);
            }
            if(this._items[this._cur - 4]){
                this._hideEl(this._items[this._cur - 4]);
            }
            if(!this._marginTop){
                var top = curItem.css('margin-top')
                this._marginTop = Number(top.substring(0,top.length-2));
            }
            var h = curItem.height() + this._marginTop;
            this._bubbleWrapper[0].style.webkitTransform = "translateY(-" + (this._movement + h) + "px)";

            this._movement += h;
            this._cur++;
        },
        _showEl: function( $el ){
            $el.css('opacity', 1);
        },
        _hideEl: function( $el ){
            $el.css('opacity', 0);
        },
        // _showAllEl: function(){
        //     var _this = this;
        //     $.each(this._items,function(){
        //         _this._showEl($(this));
        //     });
        // },
        // _hideAllEl: function(){
        //     var _this = this;
        //     $.each(this._items,function(){
        //         _this._hideEl($(this));
        //     });
        // },
        _stopBubble: function(){
            this._bubbleWrapper.parent().hide();
            this._bubbleBtn.hide();
            this._remove();
        },
        _startBubble: function(){
            this._bubbleWrapper.parent().show();
            this._bubbleBtn.show();
            this._stop();
            if(this.isOpen) this._startRender();
        }
    };
    module.exports = bubbleChat;
});
