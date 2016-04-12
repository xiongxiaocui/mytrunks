/**
 * @fileoverview 2015 分享组件
 * @authors liuxiaoyue3@letv.com
 * @date 20150910
 */
define(function(require,exports,module){
	var appH5 = require('components/app/apph5Adapter');
	var href = window.location.href;
	var ua = require('air/env/ua');
	var events = require('./../events');
	var baseShare = require('components/share/share_base');
	var getFormattedTime = require('air/util/getFormattedTime');

    //点击分享按钮 调用此方法 判断是否在app内 是调起app分享 还是 浮层
    var share = {
		init : function(el, shareBox, level, time){
			if(el.hasClass('cur')){
                el.removeClass('cur');
                shareBox.hide();
                if(!level){
					shareBox.closest('.graphic').css('zIndex',1);
					shareBox.removeClass('fadeDown');
                }else{
					shareBox.removeClass('fadeDown1');
                }
            }else{
				events.emit('hidePicTextShareLayer');
                if(level){
					Stats.feStat({code: 'share-btn', scode: 'tool'});
					Stats.sendAction({ap: 'ch=live&pg=diy&bk=toolshare&link=shareclick'});
					this.setPageShare(el, shareBox);
                }else{
					Stats.feStat({code: 'share-btn', scode: 'tuwen'});
					Stats.sendAction({ap: 'ch=live&pg=diy&bk=pictextshare&link=shareclick'});
					this.setBlockShare(el, shareBox, time);
                }
                el.addClass('cur');
            }
		},
		setBlockShare : function(el, shareBox, time){
			var that = this;
			/**
			 * 获取分享url
			*/
			var shareUrl='';
			//直播即将开始 分享图文直播 分享页没有时移操作
			if(info.liveStatus === '1' || info.liveStatus === '11'){
				shareUrl = href;
			}else if(info.liveStatus === '2' || info.liveStatus === '3'){ //直播中或直播转码中
				var linkMark = href.indexOf('?') > 0 ? '&' : '?';
				if(href.indexOf('shifttime') > 0){
					href = href.replace(/shifttime=\d{1,}&{1}/g,'');
				}
				if(href.indexOf('pictextid') > 0){
					href = href.replace(/pictextid=\d{1,}&{1}/g,'');
				}
				var liveBeginTime = getFormattedTime(time);
				var picTextTime = parseInt(el.attr('time'),10);

				if(picTextTime < liveBeginTime){
					shareUrl = href;
				}else{
					var shareTime = Math.floor( picTextTime - 600);
					var blockId = el.attr('id');
					shareUrl = href + linkMark + 'shifttime=' + shareTime + '&pictextid=' + blockId;
				}
			}else if(info.liveStatus === '4'){ //直播结束
				shareUrl = href;
			}

			/**
			 * 获取分享文案
			*/
			var onlineNum = '';
            //文案 判断是否在直播中 文案追加直播在线人数
            if(info.liveStatus === '2'){
				onlineNum = info.peopleOnLine + '个小伙伴正在围观,';
            }
            //针对内容的a标签 分享做特殊处理
            var content = el.parent().prev().html();
            var regExp = /<a.*>(.*)<\/a>/ig;
			content.replace(/<a href="([^\"]*?)".[^>]*?>/gi,function ($0,$1){
				content = content.replace(regExp,$1);
			});

            var text = '[乐视直播]' + onlineNum + content;
			if(info.pageid&&info.pageid==='live/play'){
				text='[乐视视频]'+ onlineNum + content;
			}

            /**
			 * 获取分享图片信息
			*/
			var img = el.closest('.graphic_cnt').find('.graphic_img').find('small')[0];
			var src = $(img).attr('data-url') || '';

			var	opt = {
				type: 'webpage',
				title: info.share.title,
				webUrl: shareUrl,
				webImage: src,
				desc: text,
				showCustomLayer : function(){
					that.showLayer(shareBox,'block');
				}
			};
			//针对超级手机分享文案处理
			if(ua.superLetvClient){
				opt.title = text;
			}
			if(navigator.userAgent.match(/MicroMessenger/i) != null){
				baseShare.setCallBack({
					customCallback : function(){
						events.emit('hidePicTextShareLayer');
						Stats.feStat({code: 'share', scode: 'wx'});
						Stats.feStat({code: 'share1', scode: 'tuwen'});
					}
				});
			}
			le.app.callShare(opt,function(){});
		},
		setPageShare: function(el, shareBox){
			var that = this;
			var opt = {
				type: 'webpage',
				title: info.share.title,
				webUrl: href,
				webImage: info.share.img,
				desc: info.share.desc,
				showCustomLayer : function(){
					that.showLayer(shareBox,'page');
				}
			};
			if(navigator.userAgent.match(/MicroMessenger/i) != null){
				baseShare.setCallBack({
					customCallback : function(){
						events.emit('hideToolShareLayer');
						Stats.feStat({code: 'share', scode: 'wx'});
						Stats.feStat({code: 'share1', scode: 'tool'});
					}
				});
			}
			le.app.callShare(opt,function(){});
		},
		showLayer : function(shareBox,type){
			//判断是否在微信
			if(navigator.userAgent.match(/MicroMessenger/i) != null){
				//显示微信分享按钮 
				shareBox.find('.ico_weixin').show();
			}
			//最后展示浮层
			shareBox.show();
			//添加动画效果
			if(type === 'page'){
				shareBox.addClass('fadeDown1');
				events.emit('hidePicTextShareLayer');
			}else{
				shareBox.closest('.graphic').css('zIndex',2);
				shareBox.addClass('fadeDown');
			}
		}
    };
    module.exports = share;
});