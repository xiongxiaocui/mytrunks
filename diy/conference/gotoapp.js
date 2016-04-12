/*
## 直播DIY播放页播放器底部导流banner selina
### config = {
    $box: jQuery对象或一个DOM选择器（只能选中一个节点），弹出层的根节点
}
*/
__req('ms::modules/open_app.js');
define(function(require, exports, module){
    var gotoApp = {
        init: function( config ){
            var ua = navigator.userAgent;
            if(/letvclient/i.test(ua) || /letvmobileclient/i.test(ua) || /LetvMobileClient\s+Android;letv;/i.test(ua) || /leuibrowser|eui browser/i.test(ua)) return;
            this.config = config;
            this._initDom();
            this._initEvent();
        },
        _initDom: function(){
            if(!$('#j-dl-fixtip').length){
                $('#videoToolBar'+this.config.widgetId).before('<section class="column app_guide" id="j-dl-fixtip"><i class="icon_font icon_phone1"></i><p>使用乐视视频APP 立即提升3倍流畅度</p><em class="ico_close"><a href="javascript:void(0);"><i class="i-1"></i><i class="i-2"></i></a></em></section>');
            }
            this._tip = $('#j-dl-fixtip');
            this._close = this._tip.find('em').eq(0);
        },
        _initEvent: function(){
            this._tip.on('click',_.bind(this._open,this));
            this._close.on('click',_.bind(this._hide,this));
        },
        _hide: function(e){
            e.stopPropagation();
            this._tip.remove();
            this._tip.off('click',_.bind(this._open,this));
            this._close.off('click',_.bind(this._hide,this));
            this._tip = this._close = null;
            Stats.sendAction({
                ap: 'ch=msite&pg=play&bk=appfixtip&link=close'
            });
        },
        _open: function(e){
            e.preventDefault();
            __openApp._bindDefaultAppEvent({
                'url': le.api_host.app_m + '/download_general.php?ref=010111019',
                'wxUrl':'http://a.app.qq.com/o/simple.jsp?pkgname=com.letv.android.client&ckey=CK1315505951124',
                'app': 'letv',
                'streamid': this.config.liveId,
                'type':'live'
            });
        }
    };
    module.exports = gotoApp;
});