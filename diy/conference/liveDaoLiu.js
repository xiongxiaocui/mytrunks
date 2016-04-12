/**
 * 直播DIY播放页倒流位，有两种
 * 1.未开始状态：在倒计时下边的分享换成倒流位
 * '<a href="javascript:;" class="btn_liveDaoliu">使用乐视视频APP 看直播更流畅</a>'
 * 2.直播状态的时候，在播放器上方增加倒流位
 * '<a class="flow_box" href="javascript:;"><span>使用乐视视频APP 看直播更流畅</span><i>下载APP</i></a>'
 */
__req('ms::modules/open_app.js');
define(function(require, exports, module){
	'use strict';
	var ua = require('air/env/ua');
    var LiveDaoLiu = {
	    /**
	     * 组件初始化
	     * 乐视视频客户端与超级手机视频客户端不显示倒流位
	     * @param config
	     */
	    init: function (config) {
		    if (ua.letvClient || ua.superLetvClient) {
			    $('#readyBeginShareBtn' + config.markId).css('display', 'block');
			    return;
		    }
            this.initDom(config);
            this.initEvent();
		    this.initPage();
        },

	    /**
	     * 初始化DOM节点与需要使用到的变量
	     * @param config
	     */
	    initDom: function (config) {
		    this.config = config;
		    var widgetId = this.widgetId = config.markId;
		    this.liveStatus = window.info.liveStatus;
		    // 珠峰科考专题临时需求
            this.staticShareText = '';
            if (location.href.indexOf('tech_seeact2016') > -1) {
                this.staticShareText = '全景直播科考 下载乐视视频APP';
            }
			// end临时需求
		    this.$readyBeginShareBtn = $('#readyBeginShareBtn' + widgetId);
		    this.$readyBeginCountDown = $('#readyBeginCountDown' + widgetId);
		    this.$readyBeginCountDown = $('#readyBeginCountDown' + widgetId);
		    this.$beginingSection = $('#begining' + widgetId);
		    this.readyBeginInited = false;
		    this.beginningInited = false;
	    },

	    /**
	     * 初始化事件
	     */
	    initEvent: function () {
		    $('body').on('click', '.j_livePageDaoliu', $.proxy(this.open, this));
	    },

	    /**
	     * 对页面节点进行修改或增加
	     */
	    initPage: function () {
		    if (this.liveStatus === '1' || this.liveStatus === '11') {
			    this.$readyBeginShareBtn.remove();
			    this.initReadyBegin();
		    }
		    if (this.liveStatus === '2') {
			    this.initBeginning();
		    }
	    },

	    /**
	     * 未开始状态下执行倒流位初始化
	     */
	    initReadyBegin: function(){
		    if(this.readyBeginInited){
			    return;
		    }
			var shareText = this.staticShareText || '使用乐视视频APP 看直播更流畅';
		    var tpl = '<a id="readyBeginDaoliu' + this.widgetId + '" href="javascript:;" class="j_livePageDaoliu btn_liveDaoliu">' + shareText + '</a>';
		    this.$readyBeginCountDown.after(tpl);
		    this.readyBeginInited = true;
	    },

	    /**
	     * 正在直播状态下执行倒流位初始化逻辑
	     */
	    initBeginning: function(){
		    if(this.beginningInited){
			    return;
		    }
			var shareText = this.staticShareText || '使用乐视视频APP 看直播更流畅';
			var tpl = '<section id="breginningDaoliu'+this.widgetId+'" class="flow_box">'+
				'<div class="j_livePageDaoliu daoliu_btn"><a href="javascript:;" k-name="send-stat" data-stat="{ap:\'fl=di&dp=msite_live_play_top_guide_click_bannerclick\'}">下载APP</a></div>'+
				'<div class="daoliu_cnt">'+
				'<span>'+shareText+' </span>'+
				'</div>'+
				'</section>';
			this.$beginingSection.before(tpl);
		    this.beginningInited = true;
	    },

	    /**
	     * 调起乐视视频客户端
	     */
	    open: function(e){
            e.preventDefault();
		    var commonConfig = {
			    'url': le.api_host.app_m + '/download_general.php?ref=010110975',
			    'wxUrl':'http://a.app.qq.com/o/simple.jsp?pkgname=com.letv.android.client&ckey=CK1321549501072',
			    'app': 'letv'
		    };
		    var mplat = ua.letvMobile ? 'lingxian' : (ua.android ? 'android' : 'ios');
            var browser = (Stats && Stats.BR) ? Stats.BR : 'letv';
            var position = 'diy';
		    if(info.liveStatus==='1'){
			    // 点播
			    __openApp._bindDefaultAppEvent($.extend(commonConfig,{
				    'type': 'play',
				    'vid': this.config.vid,
				    'from': 'm_' + mplat + '_' + browser + '_' + position
			    }));
		    } else if(info.liveStatus === '11') {
			    // 轮播，这里使用livetype为lunbo，如有卫视台的情况，暂时无法区分，不考虑
			    __openApp._bindDefaultAppEvent($.extend(commonConfig,{
				    'streamid': this.config.channelId,
				    'type': 'live',
				    'livetype': 'lunbo',
				    'from': 'm_' + mplat + '_' + browser + '_' + position
			    }));
		    } else if (info.liveStatus === '2') {
			    // 正在直播
			    __openApp._bindDefaultAppEvent($.extend(commonConfig,{
				    'streamid': info.liveId,
				    'type': 'live',
				    'from': 'm_' + mplat + '_' + browser + '_' + position
			    }));
		    }
        }
    };
    module.exports = LiveDaoLiu;
});