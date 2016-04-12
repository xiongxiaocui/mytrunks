/**
 * @fileoverview 2015 页面标题栏分享按钮
 * @authors liuxiaoyue3@letv.com
 * @date 20150910
 */
define(function(require,exports,module){
    var base = require('./share/share_base');
    var baseShare = require('components/share/share_base');
    var ua = require('air/env/ua');
    var events = require('./events');

    function pageShare(){
		this.TPL = [
			'<div class="shareBox1">',
				'<b class="arrow_top"></b>',
				'<div class="share_cnt">',
					'<ul>',
						'<li class="ico_weixin" data-type="weixin"><a href="javascript:;"><i class="icon_font icon_weixin"></i><span>微信</span></a></li>',
						'<li class="ico_qq" data-type="qzone"><a href="javascript:;"><i class="icon_font icon_qone"></i><span>QQ空间</span></a></li>',
						'<li class="ico_weibo" data-type="weibo"><a href="javascript:;"><i class="icon_font icon_sina"></i><span>新浪微博</span></a></li>',
					'</ul>',
				'</div>',
			'</div>',
			'<div class="tipBox">',
				'<b class="arrow_top"></b>',
				'<p>听说积极分享的都是好人!</p>',
				'<em class="ico_close">',
					'<a href="javascript:void(0);">',
						'<i class="i-1"></i>',
						'<i class="i-2"></i>',
					'</a>',
				'</em>',
			'</div>'
		].join('');
		this.layerEvent = false;
    }
    pageShare.prototype = {
		init : function(opt){
			this.opts = $.extend({},opt);
			this.root = $('#videoToolBar' + this.opts.widgetId);
			this.initDom();
			this.initEvent();
		},
		initDom : function(){
			var icon = $('#toolBarShareBtn' + this.opts.widgetId).find('i');
			if(navigator.userAgent.match(/MicroMessenger/i) != null){
				icon.addClass('icon_share2');
			}else{
				icon.addClass('icon_share1');
			}
			this.root.append(this.TPL);
		},
		initEvent : function(){
			var that = this;
			var root = this.root;
			root.find('.ico_share').on('click',_.bind(this.showLayer, this));
			root.find('.ico_close').on('click',_.bind(this.hidePopTip, this));

			if (this.opts.startHideTips) {
				that.hidePopTip();
			}

			setTimeout(function(){
				that.hidePopTip();
			},5000);
            root.delegate('.shareBox1', 'touchstart click', function(e){
                e.stopPropagation();
            });
            events.on('hideToolShareLayer',function(){
				root.find('.ico_share').removeClass('cur');
				if(!ua.superLetvClient){
					var shareBox1 = root.find('.shareBox1');
					shareBox1.hide();
					shareBox1.removeClass('fadeDown1');
				}
			});
		},
		showLayer : function(e) {
			e.preventDefault();
            e.stopPropagation();
			var el = $(e.target).closest('li');
			var shareBox = this.root.find('.shareBox1');
			base.init(el,shareBox,'page');
			this.root.find('.tipBox').hide();
			if(!this.layerEvent){
				shareBox.delegate('li', 'click', _.bind(this.startShare,this));
			}
		},
		startShare : function(e){
			var li = $(e.target).closest('li');
			var type = li.attr('data-type');
			if(type === 'weixin'){
				//在通用直播播放页上报通用直播播放页，否则沿用diy上报
				if(info.pageid&&info.pageid==='live/play'){
					Stats.sendAction({ap: 'ch=liveplay&pg=live&bk=toolshare&link=weixinclick'});
				}else{
					Stats.sendAction({ap: 'ch=live&pg=diy&bk=toolshare&link=weixinclick'});
				}

				baseShare.weixinShare();
			}else{
				if(type === 'qzone'){
					if(info.pageid&&info.pageid==='live/play'){
						Stats.sendAction({ap: 'ch=liveplay&pg=live&bk=toolshare&link=qqclick'});
						Stats.feStat({code: 'share', scode: 'qq'});
						Stats.feStat({code: 'share1', scode: 'tool'});
					}else{
						Stats.sendAction({ap: 'ch=live&pg=diy&bk=toolshare&link=qqclick'});
						Stats.feStat({code: 'share', scode: 'qq'});
						Stats.feStat({code: 'share1', scode: 'tool'});
					}

				}
				if(type === 'weibo'){
					if(info.pageid&&info.pageid==='live/play'){
						Stats.sendAction({ap: 'ch=liveplay&pg=live&bk=toolshare&link=weiboclick'});
						Stats.feStat({code: 'share', scode: 'wb'});
						Stats.feStat({code: 'share1', scode: 'tool'});
					}else{
						Stats.sendAction({ap: 'ch=live&pg=diy&bk=toolshare&link=weiboclick'});
						Stats.feStat({code: 'share', scode: 'wb'});
						Stats.feStat({code: 'share1', scode: 'tool'});
					}

				}
				baseShare.otherShare(type);
			}
		},
		hidePopTip : function(){
			this.root.find('.tipBox').hide();
		}
    };
    module.exports = pageShare;
});