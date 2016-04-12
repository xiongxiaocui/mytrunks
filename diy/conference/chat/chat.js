/*
## 直播播放页聊天室 selina
##聊天室和聊天室弹幕读取同一套数据，聊天室tab展开时，弹幕关闭，反之弹幕打开。
##同一套数据缓存在bufferMsg.js中，无论聊天室还是弹幕从缓存池中通过shift()方式读取。
##弹幕中历史消息展示完毕，此时没有新消息，用户第一次切到聊天室tab时，为避免聊天室消息空，会存储最新5条历史消息备用。
*/
__req('lib::hogan/hogan.js');
__req('modules/open_app.js');
__req('components/app/apph5Adapter');
define(function(require, exports, module){
	// 如果是DIY编辑页，聊天室的功能就不需要了
	if (location.href.indexOf('editZtdiySubject') > -1) {
		return;
	}
    var Overlay = require('air/ui/overlay');
    var Bindphone = require('modules/bindphone');
    var ImgStat = require('components.img_load');
    var events = require('./../events');
    var BubbleChat = require('./bubble_chat');
    var BufferMsgArr = require('./buffer_msg');//缓存池中消息
    var uid = Cookie.get('ssouid');//获取登录用户uid
    var InterfaceErrorTip = require('components/interfaceErrorTip');
    var TimeService = require('comp/TimeService');

	var $ = Zepto;
    //聊天信息tpl层
    var tpl = Hogan.compile(['<dl class="j-chatMsg {{#isStar}}cmt_infoStar {{/isStar}}{{#isHost}}cmt_infoHost {{/isHost}}{{#isSelf}}cmt_info1 cmt_info3{{/isSelf}}{{^isSelf}}cmt_info cmt_info2{{/isSelf}}">',
        '{{#user}}',
        '<dd class="cmt_img"><img src="{{icon}}" alt="{{nickname}}" title="{{nickname}}">{{#isStar}}<i class="icon_font icon_collect"></i>{{/isStar}}',
        '</dd>{{/user}}',
        '<dd class="cmt_cnt{{#gotoapp}} j-gotoappMsg{{/gotoapp}}">{{#isHost}}<i class="icon_font icon_huatong"></i>{{/isHost}}{{{message}}}',
            '{{#user}}{{^isSelf}}<p class="cmt_name">{{nickname}}</p>{{/isSelf}}{{/user}}',
        '</dd>',
    '</dl>'].join('') );
    //备用聊天信息tpl层
    var listTpl = Hogan.compile(['{{#list}}<dl class="j-chatMsg {{#isStar}}cmt_infoStar {{/isStar}}{{#isHost}}cmt_infoHost {{/isHost}}{{#isSelf}}cmt_info1{{/isSelf}}{{^isSelf}}cmt_info{{/isSelf}}">',
        '{{#user}}',
        '<dd class="cmt_img"><img src="{{icon}}" alt="{{nickname}}" title="{{nickname}}">{{#isStar}}<i class="icon_font icon_collect"></i>{{/isStar}}',
        '</dd>{{/user}}',
        '<dd class="cmt_cnt{{#gotoapp}} j-gotoappMsg{{/gotoapp}}">{{#isHost}}<i class="icon_font icon_huatong"></i>{{/isHost}}{{{message}}}',
            '{{#user}}{{^isSelf}}<p class="cmt_name">{{nickname}}</p>{{/isSelf}}{{/user}}',
        '</dd>',
    '</dl>{{/list}}'].join('') );

    //点击聊天室标签时，如果初始化过，则重新开始更新消息，并开启计时渲染默认消息
    var startFun = function( opt ){
        if(chat._init){
            chat._stopRender = false;
            //chat._renderDefault();//产品确认去掉默认导流文案
            chat._updateMessage();
            chat._chatInputBox.show();
            //chat._mainBox.css('bottom', chat._chatInputBox.height());
        }else{
            chat.init( opt );
        }
    };
    var stopFun = function( opt ){
        if(chat._init){
            chat._stopRender = true;
            $('#chatRoomWrap_'+ chat._widgetId + ' .cmt_info').removeClass('cmt_info2').css('opacity',1);
            $('#chatRoomWrap_'+ chat._widgetId + ' .cmt_info1').removeClass('cmt_info3').css('opacity',1);
            chat._rendering = false;
            chat._timer && clearTimeout(chat._timer);
            chat._chatInputBox.hide();
            //chat._mainBox.css('bottom','0');
        }
    };
    //点击聊天室标签以及播放器退出全屏时
    events.on('requestLiveChat', startFun);
    //点击其他标签时，停止聊天室消息的渲染，同时把已渲染的消息的动画效果去掉。
    events.on('stopRenderLiveChat', stopFun);
    //播放器全屏时，停止聊天室消息的渲染，退出全屏时判断聊天室tab是否当前状态，如果是继续聊天室消息渲染。
    events.on('playerChangeFullscreen',function(data){
        if(data.flag){
            stopFun();
            events.emit('stopBubbleChat');
        }else{
            if ($('#chatRoomWrap_' + chat._widgetId).length === 0) {
                return;
            }
            if($('#chatRoomWrap_'+ chat._widgetId).hasClass('active')){
                startFun();
                return;
            }
            events.emit('startBubbleChat');
        }
    });

    //直播结束时，关闭聊天室连接，停止渲染默认消息,产品确认聊天室一直可用@盖鹏
    // events.on('playerEnd', function(){
    //     chat._timer && clearTimeout(chat._timer);
    //     chat._websocket && chat._websocket.close(1000,'直播结束');
    //     chat._chatInputBox.hide();
    // });
    //聊天室交互
    var chat = {
        config: {
            defaultText: '我也说句话',
            sendMsgLen: 50,//可以发言的最大长度
            bufferMsgLen: 30,//缓存池中消息条数
            defaultMsgLen: 20,//不支持websocket的浏览器中渲染的历史消息条数
            historyMsgLen: 15,//支持websocket的浏览器中渲染的历史消息条数
            showMsgLen: 30,//聊天室最多同时展示的消息条数
            timeout: 5*60*1000,//默认消息的间隔展现时间5分钟
            defaultColor: ['color2','color3','color4','color5','color6'],
            //错误消息
            code: {
                'overflow' : '最多输入25个汉字',
                'empty':    '请输入内容',
                '1001' :    '用户未登录',
                '1002' :    '聊天室打烊了~',
                '1003' :    '聊天室打烊了~',
                '1004' :    '您输入的文字含有非法字符',
                '1005' :    '啊!请您再喊一遍,服务器乘小火箭赶来~',//产品确认此种情况不提示
                '1006' :    '您输入过快，歇一会儿再发吧',
                '1007' :    '这条内容发过了哦~'
                //‘1008’:   '需要实名认证'//下方有逻辑处理
            },
            url: {
                'addChat' : le.api_host.api_my + '/chat/message',
                'getChat' : le.api_host.api_my + '/chat/history'
            }
        },
        //存储历史中最近5条消息，作为备用。如果弹幕中历史消息展示完毕，此时没有新消息，用户第一次切到聊天室tab时，为避免聊天室消息空。
        spareMsgArr: [],
        myMsgArr: [],//本人发的消息
        defaultMsgArr: [],//默认消息
        _init: false,//是否初始化过
        _timeflag: false,//开启默认消息的时间标志
        _firstRender: true,//第一次渲染聊天标志
        _currentMsgNum: 0,//目前聊天数量
        _previsApp: false,//是否刚刚渲染过导流信息
        _rendering: false,//是否正在渲染
        _stopRender: false,//标签从聊天室切走时停止渲染聊天信息
        _reconnectTime: 1,//websocket断开后自动重连次数
        _errorTime: 1,
        _serverTime: parseInt(new Date().getTime()/1000), //先取本地时间
        _isLostFocus:false, //浏览器是否被切入后台
        init: function( opt ){
            var _self=this;
            //测试聊天室页面http://10.154.252.32:8000/chatroom.html
            //消息协议wiki:http://wiki.letv.cn/pages/viewpage.action?pageId=46182913
            //http://api.live.letv.com/v1/liveRoom/single/1006?id=直播id
            //chatRoomNum

            if(!opt.liveId) return;
            this._widgetId = opt.widgetId;
            //即便没有聊天室tab，因为需要接收解说弹幕，即便没有聊天室tab，也得创建websocket
            //if(!$( '#chatRoomWrap_' + this._widgetId ).length) return;//如果没有聊天室tab，不执行后续
            this._getRoomId( opt );

            this._getServerTime();

            /**
             * 因为时效性要求较高，不得已把代码放在这里
             */

            $(window).blur(function(){
                _self._isLostFocus=true; //切入到后台标记
            });

            $(window).focus(function(){
                _self._isLostFocus=false; //切换到浏览器标记
            });



        },

        /**
         * 每秒更新一次服务器时间，以保证时间与服务器同步
         * @private
         */
        _getServerTime:function(){
            var self=this;
            window.setInterval(function(){
                TimeService.get(function (time) {
                    self._serverTime = Math.floor(time);
                }, 3000);
            },1000);
        },

        _getRoomId:function( opt ){
            var _this = this;
            $.ajax({
                url: le.api_host.api_live + '/v1/liveRoom/single/1006?callback=?&id='+opt.liveId,
                timeout: 10000,
                success: function(json){
                    json && (_this._roomId = json.chatRoomNum);
                    if(_this._init || !_this._roomId) return;
                    //console.log('roomid:'+_this._roomId);
                    _this._init = true;
                    _this._initDom();
                    _this._initEvent();
                    BubbleChat.init( opt.widgetId);

                    _this._initList();
                },
                error: function(xhr, errorType){
                    //_this._error('没有找到聊天室');
                    _this._post({
                        'type': errorType,
                        'desc': '获取聊天室ID接口liiveRoom异常,对应直播id'+opt.liveId
                   });
                }
            })
        },
        _post: function(obj){
            var data = {
                    'type': obj.type,
                    'desc': obj.desc
                };
            Deferred.post(le.api_host.fe_go + '/api/feedback', data);
        },
        _initDom: function(){
            //this._mainBox = $('.main_body');
            this._chatCon = $( '#chatRoomWrap_' + this._widgetId );
            if(!this._chatInputBox){
                $('body').append(this._chatInputBox = $('<div class="cmt_input" id="j-chatInputBox" style="display:none"><div class="cmt_input_cnt"><div class="inputBox"><input id="j-chatInput" type="text" class="input1" value="'+this.config.defaultText+'"></div><a href="javascript:;" class="ico_send_no" id="j-chatSend">发送</a><span class="num" id="j-chatNum"><b>0</b>/'+this.config.sendMsgLen+'</span></div></div>'));
            };
            this._chatInput = $('#j-chatInput');
            this._chatSend = $('#j-chatSend');
            this._textNum = $('#j-chatNum');
            //this._chatList = $('#j-chatList');
            this._aniBox = $('.cmt_ani_box')[0];
            this._chatList = $('.cmt_data_box');
            this._loading = this._chatList.find('.loadBox');
            this._children = this._chatCon.find('.cmt_data,.cmt_ani_box');
            //先从服务器获取一次时间
            TimeService.get(function (time) {
                self._serverTime = Math.floor(time);
            }, 3000);
        },
        _initEvent: function(){
            var _this = this;

            this._chatInput.on({
                'focus':function(){
                    _this._focus()
                },
                'input':function(evt){
                    _this._checkMsgNum();
                },
                'blur':function(evt){
                    if($.trim(_this._chatInput.val()) === ''){
                        _this._blur(evt);
                    }
                },
                'poste':function(evt){
                    setTimeout(function(){
                        _this._checkMsgNum();
                    },100)
                }
            });
            this._chatSend.on('click', function(){
                _this._send();
            });

            //监测客户端的登录回调，执行刷新页面操作
              document.addEventListener('onlogin',function(evt){
                  //调起客户端登录，如果没有登录，直接返回，也会执行，通过$.cookie('ssouid')为空来判断是这种情况，不执行接下来的操作
                  if(!$.cookie('ssouid')) return;
                  location.href = location.href;
              });
            //如果用户切到聊天室tab，点击输入框，跳转去登陆，希望登陆回来，自动打开聊天室Tab

            $(window).on('load', _.bind(this._setChatTab, this));
        },

        _initList: function () {
            var _this = this,
                params = {roomId:this._roomId,server:true};
             $.ajax({
                url: this.config.url.getChat+'?version=2.0&protocol=websocket&callback=?&rnd='+(new Date().getTime()),
                dataType: 'jsonp',
                timeout: 5000,
                data: params,
                success: function(json){
                    if(json.code == '200'){
                        Stats.feStat({code: 'chat-diy', scode:'success'});
                        var server = json.data.result.server;
                        var mesList = json.data.result.list;

                        //过滤置顶弹幕和底部消息
                        var newList=[];
                        for (var i = 0; i <= mesList.length-1; i++) {
                            //mesList[i].message=_this.transcoding(mesList[i].message);
                            if (mesList[i].position != "5" && mesList[i].position!="6") {
                                newList.push(mesList[i]);
                            }
                        }
                        mesList=newList;
                        //接口返回不一定是空数组
                        if(mesList && mesList.length){
                            var list = mesList.concat();
                            var spareList = list.concat();//复制一份
                            var listLen = list.length;
                            var len = 0;
                        }

                        //支持websocket的浏览器初始化websocket，并渲染历史消息，不支持的浏览器只渲染历史消息即可。
                        window.WebSocket = window.WebSocket || window.MozWebSocket;
                        if (listLen) {
                            Stats.feStat({code: 'chat-diy', scode: 'hasMes'});
                            len = window.WebSocket ? _this.config.historyMsgLen : _this.config.defaultMsgLen;
                            var bufferMsgArr = listLen <= len ?  list : list.splice( listLen - len, listLen);
                            // 模拟发送数据
                            //_this.msg0 = list[0];
                            //将消息数据存入缓存池
                            BufferMsgArr.push.apply(BufferMsgArr, bufferMsgArr);
                            events.emit('showHCommentary',bufferMsgArr);
                            //留存5条备用
                            _this.spareMsgArr = listLen <= 5 ? spareList : spareList.splice( listLen - 5, listLen);
                            if(!_this._chatCon.hasClass('active')){
                                Stats.feStat({code: 'chat-diy', scode: 'gotoRender'});
                                //执行渲染弹幕
                                events.emit('renderBubbleChat');
                            }

                        } else {
                            _this._loading.hide();
                            _this._chatList.append(_this._noData = $('<div class="cmt_no active"><i class="icon_font icon_sofa1"></i><p>叫我第一名，我来抢沙发</p></div>'));
                            Stats.feStat({code: 'chat-diy', scode: 'noMes'});
                        }
                        if(_this._chatCon.hasClass('active')){
                            _this._loading.hide();
                            _this._chatInputBox.show();
                            _this._updateMessage();
                        }
                        window.WebSocket && _this._initWebSocket(server);
                        if(!window.WebSocket){
                            Stats.feStat({code: 'chat-diy', scode:'noWebSocket'});
                        }
                    }else{
                        _this._error(this.config.code[json.code]);
                        Stats.feStat({code: 'chat-diy', scode:'errorCode'});
                    }
                },
                error: function(xhr, errorType){
                     _this._children.hide();
                     if(!_this.interfaceErrorTip){
                        _this.interfaceErrorTip = new InterfaceErrorTip();
                        _this.interfaceErrorTip.init({
                            'container': _this._chatCon,
                            'callback': function(){
                                _this._children.show();
                                _this._initList();
                            }
                        });
                    }else{
                        _this.interfaceErrorTip.showTip();
                    }
                    Stats.feStat({code: 'chat-diy', scode: 'fail'});
                    _this._post({
                        'type': errorType,
                        'desc': '获取聊天室历史接口history异常roomID'+_this._roomId
                   });
                }
            });
        },
        _initWebSocket: function(serverResult){
            var _this = this;
            this._serverResult = serverResult;


            this._websocket = new WebSocket(this._serverResult.server);
            //this._newSocketTime = +new Date();

            this._websocket.binaryType = 'arraybuffer';
            this._websocket.onopen = $.proxy(this._onOpen, this);
            this._websocket.onerror = $.proxy(this._onError, this);
            this._websocket.onclose = $.proxy(this._onClose, this);
            this._websocket.onmessage = $.proxy(this._onMessage, this);

            this._ping = setInterval($.proxy(_this._sendPing, _this), 60000); //一分钟发一次私有心跳

        },
        _onOpen: function(){
            //this._SocketOpenTime = +new Date();
            var _this = this;
            //重新连接后，清除重连检测
            _this._reconnect && clearTimeout(_this._reconnect);
            _this._reconnectTime = 1;
            //登陆聊天室
            var join = {};
            join["roomId"] = parseInt(this._roomId);//必须int型，否则报连接失败，异常关闭
            //join["roomId"] = this._roomId;//必须int型，否则报连接失败，异常关闭
            join["token"] = this._serverResult.token;
            var joinStr = JSON.stringify(join);

            var buff = new ArrayBuffer(24 + joinStr.length);
            // set Header
            var header = new DataView(buff);
            header.setUint16(0, 0x0105, false);   //cmd
            header.setUint32(4, joinStr.length, false);

            // set Body
            var bufView = new Uint8Array(buff);
            for (var i=0, strLen=joinStr.length; i<strLen; i++) {
                bufView[24+i] = joinStr.charCodeAt(i);
            }

            _this._websocket.send(buff);
            _this._joinSocketTime = +new Date();

            //开始计时
            //_this._renderDefault();
        },

        _onMessage: function(message){

            var self=this;
            var dv = new DataView(message.data);
            var cmd = dv.getUint16(0);
            var len = dv.getUint32(4);
            switch(cmd){
                 case 0x0401:
                    //聊天室消息
                    try{
                        var json = JSON.parse(this._decodeUtf8(message.data.slice(24)));//防止返回的不是JSON格式
                        if(LETV.cookie('ssouid') == json.user.uid) return;
                        if(json.position=='6') return;

                        if(json.position=='5'){

                            var timeoffset= self._serverTime-parseInt(json.addtime);

                            //解说弹幕需要单独处理
                            //抛弃消息发送时间与当前时间偏差超过60秒的消息(取正负是因为不同浏览器得到的结果有区别)
                            var alowTimeOffset=20;
                            if((timeoffset>=(0-alowTimeOffset))&&(timeoffset<=alowTimeOffset)){

                                events.emit('showCommentary',json);

                            }

                        }else{
                            this._pushMessage(json);
                        }

                    }catch(e){
                        //console.log(e)
                    };

                    break;
                 case 0x0002:
                    //心跳应答PONG
                    // console.log("PONG")
                    break;
                 case 0x0106:
                    //加入聊天室应答
                    //this._joinSocketSuccessTime = +new Date();
                    //console.log(this._decodeUtf8(message.data.slice(24)))
                    this._vtkey = JSON.parse(this._decodeUtf8(message.data.slice(24)))['vtkey'];
                    break;
             }
            //上报新建websocket到打开时间，发送加入聊天到接到聊天室应答时间
            // ImgStat('/dc.gif?action=new_socket&1' + (this._SocketOpenTime - this._newSocketTime) +
            //             '_2'+(this._joinSocketSuccessTime - this._joinSocketTime));
        },
        _onError: function(message){
            JSTracker.send(400);//上报websocket连接出错
            //console.log(message);
        },
        _onClose: function(message){//每10s重新连一次服务器，如果连续三次失败，则30s后重连一次
            JSTracker.send(401);////上报websocket连接关闭
            var _this = this;
            var timeout = 10000;
            this._ping && clearInterval(this._ping);
            //上报websocket连接关闭的code码
            ImgStat('/dc.gif?action=close_socket&code=' + message.code);
            if(message.code == 1000) return;//如果直播结束,正常关闭，不重新连接
            this._reconnect && clearTimeout(this._reconnect);
            this._reconnectTime++;
            if(this._reconnectTime > 3){
                timeout = 30000;
                this._reconnectTime = 1;
            }
            this._reconnect = setTimeout($.proxy(_this._initWebSocket, _this), timeout, _this._serverResult);
        },
        _sendPing: function(){
             //console.log('ping');
            var buff = new ArrayBuffer(24);
            var header = new DataView(buff);
            header.setUint16(0, 0x0001, false);   //cmd
            header.setUint32(4, 0, false);
            this._websocket.send(buff);
        },
        _sendLocked: false,
        _send: function(){
            var _this = this,
                msg = this._formatMsg(this._chatInput.val()),
                params;
            if(this._chatSend.hasClass('ico_send_no')) return;
            if(!msg || msg == this.config.defaultText){
                this._error(this.config.code['empty']);
                return;
            }
            if(this._checkMsgNum() > this.config.sendMsgLen){
                this._error(this.config.code['overflow']);
                return;
            }
            if(this._sendLocked) return;

            this._sendLocked = true;
            //为了兼容各种手机，当点击发送的时候，讲区域设置滚动。
            //this._inputFixFun();
            params = {
                roomId: this._roomId,
                message: msg,
                realname: 1,
                from: 8,
                vtkey: this._vtkey
            };
            $.getJSON(this.config.url.addChat+'&callback=?', params, function(json){
                //console.log('sended!!');
                //console.dir(json);
                if (json.code =='200') {
                    _this._chatInput.val(_this.config.defaultText);
                    _this._textNum.removeClass('color_org color_red').html('<b>0</b>/'+_this.config.sendMsgLen);
                    _this._chatSend.removeClass('ico_send').addClass('ico_send_no');
                    _this.myMsgArr.push(json.data.result);
                    _this._updateMessage();
                    Stats.feStat({code: 'cmt'});
                } else if (json.code == '1008') {
                    Bindphone();
                } else {
                    _this._error(_this.config.code[json.code]);
                }
                _this._sendLocked = false;
            });
            //$.post('http://10.154.252.32:48080/engine/room/msg?roomid=1000000015',msg);
        },

        //按照消息协议解析消息
        _decodeUtf8: function(arrayBuffer) {
            var result = "";
            var i = 0;
            var c = 0;
            var c1 = 0;
            var c2 = 0;

            var data = new Uint8Array(arrayBuffer);

            // If we have a BOM skip it
            if (data.length >= 3 && data[0] === 0xef && data[1] === 0xbb && data[2] === 0xbf) {
                i = 3;
            }

            while (i < data.length) {
                c = data[i];

                if (c < 128) {
                    result += String.fromCharCode(c);
                    i++;
                } else if (c > 191 && c < 224) {
                    if( i+1 >= data.length ) {
                        throw "UTF-8 Decode failed. Two byte character was truncated.";
                    }
                    c2 = data[i+1];
                    result += String.fromCharCode( ((c&31)<<6) | (c2&63) );
                    i += 2;
                } else {
                    if (i+2 >= data.length) {
                        throw "UTF-8 Decode failed. Multi byte character was truncated.";
                    }
                    c2 = data[i+1];
                    c3 = data[i+2];
                    result += String.fromCharCode( ((c&15)<<12) | ((c2&63)<<6) | (c3&63) );
                    i += 3;
                }
            }
              return result;
        },
        _pushMessage: function(message){
            //如果聊天室不是当前tab,同时弹幕关闭，总是保留最新的消息到缓存池
            if(this._stopRender && !BubbleChat.isOpen ){
                BufferMsgArr.shift();
                BufferMsgArr.push(message);
                return;
            }
            //如果是普通用户的发言信息，缓存池满的时候，会丢掉该条发言信息。
            if(!message.user.role && BufferMsgArr.length === this.config.bufferMsgLen) return;
            BufferMsgArr.push(message);
            this.spareMsgArr.shift();
            this.spareMsgArr.push(message);
            if(BufferMsgArr.length == 1){
                if(this._chatCon.hasClass('active')){
                    this._updateMessage();
                }else{
                    events.emit('startBubbleChat');
                }
            }
        },
        _updateMessage: function(){
            if(this._stopRender || this._rendering || !(this._chatCon.hasClass('active'))) return;
            var _this = this;
            // _this.msg0 && setTimeout(function () {
            //  var msg = _this.msg0;
            //  msg.message = '一二三四五六七八九十一二'.slice(0, Math.ceil(Math.random()*12));
            //  _this._pushMessage(msg);
            // }, 3000);
            //当未渲染过任何消息，同时以下三种数据都为空的时候，会去读取备用的最近5条历史消息
            if (!(this.myMsgArr.length || this.defaultMsgArr.length || BufferMsgArr.length)) {
                if(this.spareMsgArr.length && this._firstRender){
                    this._renderSpareMsg();
                    this._firstRender = false;
                }
            }else{
                var message = this.myMsgArr.length ? this.myMsgArr.shift() :
                            (this.defaultMsgArr.length ? this.defaultMsgArr.shift() :
                                 BufferMsgArr.shift());
                this._render(message);
            }


        },
        //如果用户切到聊天室tab，点击输入框，跳转去登陆，希望登陆回来，自动打开聊天室Tab
        _setChatTab:function(){
            if($.cookie('comefromChatInput')){
                $('a[data-toggle="tab"]').each(function(){
                    if($(this).attr('href').indexOf('#chat') >= 0){
                        $(this).tab('show');
                        $.removeCookie('comefromChatInput');
                        events.emit('requestLiveChat');
                    }
                });
            }
        },
        _focus: function(){
            var _this = this;
            if(this._chatInput.val() == this.config.defaultText){
                this._chatInput.val('');
            }
            if(!uid){
                le.app.callLogin();
                $.cookie('comefromChatInput', 1);
                return;
            }
            this._chatInput.focus();
            //为了兼容各种手机，当输入框获取焦点的时候，讲区域设置滚动。
            //this._inputFixFun();
        },
        _blur: function(){
            if(this._chatInput.val() == ''){
                this._chatInput.val(this.config.defaultText);
            }
        },
        //去除输入信息的首尾空格和换行符
        _formatMsg:function(value){
            return $.trim(value).replace(/\n/g,'');
        },
        //检测输入字数,更新发送按钮状态
        _checkMsgNum:function(){
            var val = this._formatMsg(this._chatInput.val()),
                len = val.length,
                maxLen = this.config.sendMsgLen,
                warnLen = maxLen - 10,
                textNum = this._textNum;
            for(var i = 0; i < len; i++){
                if(val.charCodeAt(i) > 255){
                    len++
                }
            }
            var total = Math.ceil(len/2);

            //更新字数
            textNum.find('b').html(total);


            if(total > 0 && total < maxLen){
                textNum.removeClass('color_red')
                total >= warnLen ? textNum.addClass('color_org') : textNum.removeClass('color_org') ;
                this._chatSend.removeClass('ico_send_no').addClass('ico_send');
            }else if(total == maxLen){
                this._textNum.removeClass('color_org').addClass('color_red');
                this._chatSend.removeClass('ico_send_no').addClass('ico_send');
            }else{
                textNum.removeClass('color_org');
                total > maxLen ? this._textNum.addClass('color_red') : this._textNum.removeClass('color_red');
                this._chatSend.removeClass('ico_send').addClass('ico_send_no');
            }
            return total;
        },
        _error: function(type){
            if(type){
                new Overlay({
                    html: '<section class="windowBox"> <div class="chatTip"><p>'+type+'</p></div></section>',
                    mask: 0.6,
                    onClickMask: function(){
                        this.close();
                    },
                    autoClose: 2000
                });
            }
        },
        _formatData: function(json){
            var _this = this;
            //表情符号
            var icons = {
                ':D': 'http://i2.letvimg.com/lc01_img/201509/21/11/55/1152/icon_03.png',
                ':)': 'http://i3.letvimg.com/lc01_img/201509/21/11/55/1152/icon_01.png',
                ':O': 'http://i3.letvimg.com/lc01_img/201509/21/11/55/1152/icon_04.png',
                ':(': 'http://i2.letvimg.com/lc01_img/201509/21/11/55/1152/icon_02.png',
                ':*': 'http://i3.letvimg.com/lc01_img/201509/21/11/55/1152/icon_05.png'
            },
            reIcon = /\[([^\[\]]*)\]/gi;
            json.isSelf =  (uid && uid == json.user.uid) ? 1 : 0;
            //json.other = (!json.gotoapp && uid != json.user.uid);
            //替换其他端快捷输入的表情
            json.message = json.message.replace(reIcon,function(m1,m2){
                return icons[m2] ? '<img src="' + icons[m2] + '"/>' : m1;
            });
            //json.gotoapp || (json.randomColor = _this.config.defaultColor[_.random(0,_this.config.defaultColor.length -1)]);

            json.isStar = json.user.role == 1 ? 1 : 0;
            json.isHost = json.user.role == 2 ? 1 : 0;
            //json.isHost && (json.user.icon = 'http://i3.letvimg.com/lc03_img/201509/19/11/40/1138/icon_letv.png');
            json.gotoapp && (json.isSelf = 0);
            return json;
        },
        // _renderDefault: function(){//计时函数，socket建立连接后开始计时，如果到达间隔时间点，渲染默认导流文案
        //     var _this = this,
        //         timer;
        //     //if(!this._timeflag) return;
        //     clearTimeout(timer);
        //     this._timeflag = false;
        //     this._timer = setTimeout(function(){
        //         _this._timeflag = true;
        //         //如果是超级手机默认浏览器，不推送默认导流文案
        //         if(window.info && info.openby && info.openby === 'letvphone') return;
        //         //渲染默认导流文案
        //         _this.defaultMsgArr.push({
        //             "gotoapp": 1,
        //             "user": {
        //                 "nickname": "乐乐",
        //                 "icon": "http://i3.letvimg.com/lc03_img/201509/19/11/40/1138/icon_letv.png",
        //                 "role": 2
        //             },
        //             "message": "据说在乐视视频客户端看过直播，人生才会完整哦~<span>点击查看</span>"
        //         });
        //         _this._updateMessage();
        //     }, _this.config.timeout);
        // },
        // _bindEvent: function(){
        //     $('.j-gotoappMsg').off('click').on('click',function(){
        //         Stats.sendAction({ap:'fl=di&dp=msite_liveplay_chat_link'});
        //         //下载地址需要产品提供
        //         __openApp._bindDefaultAppEvent({
        //             'app':'letv',
        //             'url':'http://app.m.letv.com/download_general.php?ref=010110566'
        //         });
        //     });
        //     // 点击评论区，阻止所有默认事件
        //     $( '#chatRoomWrap_' + this._widgetId ).on('click', function (e) {
        //         e.preventDefault();
        //         e.stopPropagation();
        //     });
        // },
        //限制条数,删除最早期的聊天内容及对应的时间点提示
        _shift: function () {
            var chatList = this._chatList[0];
            chatList.removeChild(chatList.lastChild);
        },
        _render: function (json) {
            var _this = this;
            var chatList = this._chatList;

            //if(typeof json.gotoapp != 'undefined' && this._previsApp) return;
            //如果上一条渲染的是默认导流文案，则不再接连渲染导流文案
            //this._previsApp = json.gotoapp ?  true : false ;//记录上一条渲染的是否是导流文案
            this._rendering = true;

            this._currentMsgNum++;

            if(this._currentMsgNum > this.config.showMsgLen){
                this._currentMsgNum = this.config.showMsgLen;
                this._shift();
            };

            this._firstRender && chatList.html('');//如果是第一次渲染把“抢沙发”的清除掉
            var list = chatList[0];
            this._aniBox.style.display = '';
            this._aniBox.firstChild && list.insertBefore(this._aniBox.firstChild, list.firstChild);
            this._aniBox.innerHTML = tpl.render(json = this._formatData(json));
            this.currentMesEl = $(this._aniBox.firstChild);

            this._firstRender && (this._firstRender = false);

            //不支持css3动画的浏览器，立即渲染下一条数据
            if(!this._supportTransiton()){
                _this._rendering = false;
                _this._updateMessage();
            }else{
                this.currentMesEl.on( 'webkitAnimationEnd animationend webkitTransitionEnd transitionEnd', function(){
                    var el = $(this);
                    // el.css('opacity',1);
                    el.off( 'webkitAnimationEnd animationend webkitTransitionEnd transitionEnd' );
                    setTimeout(function(){
                       el.removeClass('cmt_info2').removeClass('cmt_info3');
                    },300)//动画结束就把动画的类名去掉，解决滚动时消息消失及标签切换时动画重新开启
                    _this._rendering = false;
                    setTimeout(function () {
                        _this._updateMessage();
                    }, 800);
                });

            }
            // this._firstRender && (this._firstRender = false);
            // _this._rendering = false;
            // setTimeout(function () {
            //     _this._updateMessage();
            // }, 1000);
            //产品确认去掉默认导流文案渲染
            //if(this._timeflag) this._renderDefault();//如果是更新，同时时间标志为真时，需要重新开启计时
            //if(json.gotoapp) this._bindEvent();//如果是更新，同时渲染默认导流文案，需要绑定事件
        },
        _renderSpareMsg: function(){
            var _this = this;
            this._currentMsgNum += this.spareMsgArr.length;
            _.map(this.spareMsgArr.reverse(),function(v){
                _this._formatData(v);
            });
            this._loading.hide();
            this._aniBox.style.display = 'none';
            this._chatList.html( listTpl.render( {'list' : this.spareMsgArr} ) );
        },
        _supportTransiton: function(){
            var el = document.body || document.documentElement;
            var style = el.style;
            return (style.transition !== 'undefined' || style.WebkitTransition !== 'undefined' ||
                    style.MozTransiton !== 'undefined' || style.OTransiton !== 'undefined');
        }//,
        // _inputFixFun: function(){
        //     var _this = this;
        //     var  isIos = /iphone|ipad|ipod/ig.test(navigator.userAgent) ;
        //     var  scTopNum = $( '#tabNav_' + this._widgetId ).parent()[0].offsetTop;
        //     setTimeout(function(){
        //         _this._mainBox[0].scrollTop = scTopNum;
        //        if(isIos){
        //            _this._mainBox[0].scrollTop = 60;
        //        }
        //     },500);

        // }
    };
    module.exports = chat;
});
