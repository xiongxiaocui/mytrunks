/**
 * @fileoverview 2015 图文直播挂件
 * @authors liuxiaoyue3@letv.com
 * @date 20150910
 */
__req('lib::gmu/zepto.imglazyload.js');//图片延迟加载组件
__req('lib::hogan/hogan.js');
define(function(require,exports,module){
    var utils = {
        formateYMD : function(time){
            var year = time.getFullYear();
            var month = time.getMonth() + 1;
            var day = time.getDate();
            return (year + '-' + (month>9?month:'0'+month) + '-' + (day>9?day:'0'+day));
        },
        formateHM : function(time){
            var h = time.getHours();
            var m = time.getMinutes();
            return (h>9?h:'0'+h)+':'+(m>9?m:'0'+m);
        }
    };

    function picTextLiveDirComp(options){
        this.TPL = [
            '{{#blockContent}}',
                '<div class="ztm_cnt">',
                    '<p class="layout_tit">',
                        '<span class="time timeColor"><i></i>{{remark}}</span><a {{#url}}href="{{url}}"{{/url}} class="titColor">{{title}}</a><span class="date dataColor">{{position}}</span>',
                    '</p>',
                    '<div class="lay_cnt">',
                        '<p class="cntColor {{^js_pics}}bot20{{/js_pics}}">{{shorDesc}}</p>',
                        '<div class="lay_box">',
                            '{{#js_pics}}',
                            '<a href="javascript:;" {{^flag}}class="tl"{{/flag}}>',
                                '<img src="http://i0.letvimg.com/lc04_img/201601/07/17/04/a_tempBg3.jpg" data-url="{{pic}}">',
                                '<small></small>',
                            '</a>',
                            '{{/js_pics}}',
                        '</div>',
                    '</div>',
                '</div>',
            '{{/blockContent}}'
        ].join('');
        this.liveData = [];
        this.init(options);
    }
    picTextLiveDirComp.prototype = {
        init : function(options){
            this.configOptions = this.initOptions(options);
            var liveContentWrap = $('#'+ options.domId);
            this.renderContent(liveContentWrap, this.configOptions.blockId);
        },
        initOptions : function(opts){
            var parms = {
                blockId : opts.blockId
            };
            return parms;
        },
        renderContent : function(wrap, id){
            var that = this;
            that.request(wrap, id, 'first');
            setInterval(function(){
                that.request(wrap, id);
            },60000);
        },
        request : function(wrap,id,first){
            var that = this;
            $.ajax({
                url: le.api_host.static_api + '/block/get?id='+ id +'&callback=?',
                dataType: 'jsonp',
                success: function(res){
                    if(res && res.code === 200){
                        //添加测试数据 记得删除
                        // if(that.liveData.length > 0){
                        //     res.data.blockContent.unshift({"androidUrl":"","bid":4237,"cityLevel":"0","cityWhiteList":"","content":"23324212","ctime":1441160152000,"endTime":"","extendJson":{"extendCid":"","extendPage":"","extendPicAll":{"pic169":"http://i1.letvimg.com/lc02_isvrs/201509/05/10/45/82fa94a5-d6a4-4290-8392-7babab7accac.jpg"},"extendPid":"","extendRange":"1","extendSubscript":"65","extendZid":""},"id":2,"iosUrl":"","mobilePic":"http://i0.letvimg.com/lc03_isvrs/201508/18/15/07/e5f6f97c-491c-4257-ac48-b0e331cf3643/thumb/2_400_300.jpg","mtime":1441503558000,"padPic":"http://i0.letvimg.com/lc03_isvrs/201508/18/15/07/e5f6f97c-491c-4257-ac48-b0e331cf3643/thumb/2_400_300.jpg","pic1":"http://i0.letvimg.com/lc03_isvrs/201508/18/15/07/e5f6f97c-491c-4257-ac48-b0e331cf3643/thumb/2_200_150.jpg","pic2":"http://i0.letvimg.com/lc03_isvrs/201508/18/15/07/e5f6f97c-491c-4257-ac48-b0e331cf3643/thumb/2_200_150.jpg","picList":{"1440x810":"","400x225":"http://i0.letvimg.com/lc03_isvrs/201508/18/15/07/e5f6f97c-491c-4257-ac48-b0e331cf3643/thumb/2_400_225.jpg","400x250":"","400x300":"","960x540":"http://i0.letvimg.com/lc03_isvrs/201508/18/15/07/e5f6f97c-491c-4257-ac48-b0e331cf3643/thumb/2_960_540.jpg","mobilePic":"http://i0.letvimg.com/lc03_isvrs/201508/18/15/07/e5f6f97c-491c-4257-ac48-b0e331cf3643/thumb/2_400_300.jpg","padPic":"http://i0.letvimg.com/lc03_isvrs/201508/18/15/07/e5f6f97c-491c-4257-ac48-b0e331cf3643/thumb/2_400_300.jpg","pic1":"http://i0.letvimg.com/lc03_isvrs/201508/18/15/07/e5f6f97c-491c-4257-ac48-b0e331cf3643/thumb/2_200_150.jpg","pic2":"http://i0.letvimg.com/lc03_isvrs/201508/18/15/07/e5f6f97c-491c-4257-ac48-b0e331cf3643/thumb/2_200_150.jpg","tvPic":"http://i0.e5f6f97c-491c-4257-ac48-b0e331cf3643/thumb/2_400_300.jpg"},"playControlPlatform":"1,2,3","playCount":2640,"playPlatform":{"420001":"Web","420003":"IOS","420003_1":"Android","420005":"Pad","420007":"TV"},"position":"2015-8-2","priority":1,"provinceWhiteList":"","pushflag":"420001,420003,420003_1,420005,420007","remark":"07:35","shorDesc":"第二条数据展示","showTag":"","showTagList":[],"skipPage":"","skipType":1,"skipUrl":"","startTime":"","subTitle":"乐视云发布会盛大开启 杨永强致欢迎辞","tag":"","tagUrl":"","title":"2222乐视云发布会盛大开启 杨永强致欢迎辞","tvPic":"http://i1.letvimg.com/lc02_isvrs/201509/06/10/17/12459112-7ac3-4e99-97c9-ae919fa1a549/thumb/2_400_300.jpg","type":1,"url":"http://www.letv.com/ptv/vplay/23324212.html","video":{"actorPlay":"","adPoint":"","alias":"","area":{"50001":"中国大陆"},"areaId":"1","areaName":"中国大陆","btime":0,"catchPlay":0,"category":{"3":"娱乐"},"chanName":"娱乐","cid":"3","controlAreas":"","createTime":"2015-08-18 14:34:03","cutoffPlatform":"","deleted":0,"description":"乐视云发布会盛大开启 杨永强致欢迎辞","diffDownload":0,"direction":0,"dolbyFlag":0,"downloadPlatform":{"290001":"Web","290003":"手机","290002":"Pad","290005":"TV"},"duration":273,"entAlbumTypeId":"","entAlbumTypeName":"","entOrder":0,"episode":"","etime":0,"firstPlayTime":"","h5Pic":"","id":23324212,"isHomemade":0,"isNarrow":"0","isshowepisode":0,"issue":0,"issueCompany":"","maker":"","matchId":0,"mid":",34084294,","mmsid":"34084294","musicAuthors":"","musicCompose":"","nameCn":"乐视云发布会盛大开启 杨永强致欢迎辞","namePinyinAbb":"l","nextChapter":0,"officialUrl":"","picAll":{"1080*608":"http://i0.letvimg.com/lc03_isvrs/201508/18/15/07/e5f6f97c-491c-4257-ac48-b0e331cf3643/thumb/2_1080_608.jpg","120*160":"http://i3.letvimg.com/lc03_yunzhuanma/201508/18/14/34/cd9d501f62d14186d429ba14df627122_34084294/thumb/5_120_160.jpg","120*90":"http://i0.letvimg.com/lc03_isvrs/201508/18/15/07/e5f6f97c-491c-4257-ac48-b0e331cf3643/thumb/2_120_90.jpg","128*96":"http://i0.letvimg.com/lc03_isvrs/201508/18/15/07/e5f6f97c-491c-4257-ac48-b0e331cf3643/thumb/2_128_96.jpg","1280*480":"http://i0.letvimg.com/lc03_isvrs/201508/18/15/07/e5f6f97c-491c-4257-ac48-b0e331cf3643/thumb/2_1280_480.jpg","1280*880":"http://i0.letvimg.com/lc03_isvrs/201508/18/15/07/e5f6f97c-491c-4257-ac48-b0e331cf3643/thumb/2_1280_880.jpg","132*99":"http://i0.letvimg.com/lc03_isvrs/201508/18/15/07/e5f6f97c-491c-4257-ac48-b0e331cf3643/thumb/2_132_99.jpg","150*200":"http://i3.letvimg.com/lc03_yunzhuanma/201508/18/14/34/cd9d501f62d14186d429ba14df627122_34084294/thumb/5_150_200.jpg","160*120":"http://i0.letvimg.com/lc03_isvrs/201508/18/15/07/e5f6f97c-491c-4257-ac48-b0e331cf3643/thumb/2_160_120.jpg","180*135":"http://i0.letvimg.com/lc03_isvrs/201508/18/15/07/e5f6f97c-491c-4257-ac48-b0e331cf3643/thumb/2_180_135.jpg","200*150":"http://i0.letvimg.com/lc03_isvrs/201508/18/15/07/e5f6f97c-491c-4257-ac48-b0e331cf3643/thumb/2_200_150.jpg","300*400":"http://i3.letvimg.com/lc03_yunzhuanma/201508/18/14/34/cd9d501f62d14186d429ba14df627122_34084294/thumb/5_300_400.jpg","320*200":"http://i0.letvimg.com/lc03_isvrs/201508/18/15/07/e5f6f97c-491c-4257-ac48-b0e331cf3643/thumb/2_320_200.jpg","320*480":"http://i1.letvimg.com/lc02_yunzhuanma/201508/19/03/07/ad370505e8dfed9bf6b74e47b4fad75f_34084294/thumb/2_320_480.jpg","400*225":"http://i0.letvimg.com/lc03_isvrs/201508/18/15/07/e5f6f97c-491c-4257-ac48-b0e331cf3643/thumb/2_400_225.jpg","400*250":"http://i0.letvimg.com/lc03_isvrs/201508/18/15/07/e5f6f97c-491c-4257-ac48-b0e331cf3643/thumb/2_400_250.jpg","400*300":"http://i0.letvimg.com/lc03_isvrs/201508/18/15/07/e5f6f97c-491c-4257-ac48-b0e331cf3643/thumb/2_400_300.jpg","640*240":"http://i0.letvimg.com/lc03_isvrs/201508/18/15/07/e5f6f97c-491c-4257-ac48-b0e331cf3643/thumb/2_640_240.jpg","640*440":"http://i0.letvimg.com/lc03_isvrs/201508/18/15/07/e5f6f97c-491c-4257-ac48-b0e331cf3643/thumb/2_640_440.jpg","640*960":"http://i1.letvimg.com/lc02_yunzhuanma/201508/19/03/07/ad370505e8dfed9bf6b74e47b4fad75f_34084294/thumb/2_640_960.jpg","90*120":"http://i3.letvimg.com/lc03_yunzhuanma/201508/18/14/34/cd9d501f62d14186d429ba14df627122_34084294/thumb/5_90_120.jpg","960*540":"http://i0.letvimg.com/lc03_isvrs/201508/18/15/07/e5f6f97c-491c-4257-ac48-b0e331cf3643/thumb/2_960_540.jpg"},"pid":10012054,"playControlPlatformCntv":"1","playControlPlatformGuoguang":"1","playControlPlatformHuashu":"1","playDuration":"04:33","playPlatform":{"420001":"Web","420003":"手机","420005":"Pad","420007":"TV"},"porder":10,"quality":"","recordCompany":"","relatedContent":"","relatedtype":"0","relativeContent":"","releaseDate":"2015-08-18","relevantVideoCounts":0,"remark":"","revMsgTime":0,"school":"","score":0,"shortDesc":"","singer":"","singleName":"","sourceId":{"200001":"网站"},"sourceName":"网站","startringPlay":"","styleId":"182233","styleName":"短视频","subCateName":"其他","subCategory":{"442002":"其他"},"subTitle":"杨永强致欢迎辞","subcid":442002,"tag":"乐视云发布会 乐视云 蜕变 发布会 杨永强 吴亚洲 张昭 吕征宇 阿木 张栋梁 超级手机 超级电视 超级汽车   乐Max 乐1 乐1Pro","titleCnt":0,"updateTime":"2015-08-19 16:21:46","url":"http://www.letv.com/ptv/vplay/23324212.html","userId":0,"videoPic":"http://i0.letvimg.com/lc03_isvrs/201508/18/15/07/e5f6f97c-491c-4257-ac48-b0e331cf3643/thumb/2_320_200.jpg","videoType":{"182233":"短视频"},"videoTypeName":"短视频","videocode":{"34084294":[{"code":{"9":"mp4"},"status":"300006"},{"code":{"13":"mp4_800"},"status":"300006"},{"code":{"21":"mp4_350"},"status":"300006"},{"code":{"22":"mp4_1300"},"status":"300006"},{"code":{"51":"mp4_720p"},"status":"300006"},{"code":{"52":"mp4_1080p3m"},"status":"300006"},{"code":{"53":"mp4_1080p6m"},"status":"300006"},{"code":{"58":"mp4_180"},"status":"300006"},{"code":{"124":"mp4_180_logo"},"status":"300006"},{"code":{"125":"mp4_350_logo"},"status":"300006"},{"code":{"126":"mp4_800_logo"},"status":"300006"}]},"viki":"","vikiFlag":0,"watchingFocus":[],"zongyiTitleCnt":0}});
                        //     res.data.blockContent.unshift({"androidUrl":"","bid":4237,"cityLevel":"0","cityWhiteList":"","content":"2332421","ctime":1441160152000,"endTime":"","extendJson":{"extendCid":"","extendPage":"","extendPicAll":{"pic169":"http://i1.letvimg.com/lc02_isvrs/201509/05/10/45/82fa94a5-d6a4-4290-8392-7babab7accac.jpg"},"extendPid":"","extendRange":"1","extendSubscript":"65","extendZid":""},"id":1,"iosUrl":"","mobilePic":"http://i0.letvimg.com/lc03_isvrs/201508/18/15/07/e5f6f97c-491c-4257-ac48-b0e331cf3643/thumb/2_400_300.jpg","mtime":1441503558000,"padPic":"http://i0.letvimg.com/lc03_isvrs/201508/18/15/07/e5f6f97c-491c-4257-ac48-b0e331cf3643/thumb/2_400_300.jpg","pic1":"http://i0.letvimg.com/lc03_isvrs/201508/18/15/07/e5f6f97c-491c-4257-ac48-b0e331cf3643/thumb/2_200_150.jpg","pic2":"http://i0.letvimg.com/lc03_isvrs/201508/18/15/07/e5f6f97c-491c-4257-ac48-b0e331cf3643/thumb/2_200_150.jpg","picList":{"1440x810":"","400x225":"http://i0.letvimg.com/lc03_isvrs/201508/18/15/07/e5f6f97c-491c-4257-ac48-b0e331cf3643/thumb/2_400_225.jpg","400x250":"","400x300":"","960x540":"http://i0.letvimg.com/lc03_isvrs/201508/18/15/07/e5f6f97c-491c-4257-ac48-b0e331cf3643/thumb/2_960_540.jpg","mobilePic":"http://i0.letvimg.com/lc03_isvrs/201508/18/15/07/e5f6f97c-491c-4257-ac48-b0e331cf3643/thumb/2_400_300.jpg","padPic":"http://i0.letvimg.com/lc03_isvrs/201508/18/15/07/e5f6f97c-491c-4257-ac48-b0e331cf3643/thumb/2_400_300.jpg","pic1":"http://i0.letvimg.com/lc03_isvrs/201508/18/15/07/e5f6f97c-491c-4257-ac48-b0e331cf3643/thumb/2_200_150.jpg","pic2":"http://i0.letvimg.com/lc03_isvrs/201508/18/15/07/e5f6f97c-491c-4257-ac48-b0e331cf3643/thumb/2_200_150.jpg","tvPic":"http://i0.letvimg.com/lc03_isvrs/201508/18/15/07/e5f6f97c-491c-4257-ac48-b0e331cf3643/thumb/2_400_300.jpg"},"playControlPlatform":"1,2,3","playCount":2640,"playPlatform":{"420001":"Web","420003":"IOS","420003_1":"Android","420005":"Pad","420007":"TV"},"position":"2015-8-2","priority":1,"provinceWhiteList":"","pushflag":"420001,420003,420003_1,420005,420007","remark":"07:35","shorDesc":"第一条最新的数据","showTag":"","showTagList":[],"skipPage":"","skipType":1,"skipUrl":"","startTime":"","subTitle":"乐视云发布会盛大开启 杨永强致欢迎辞","tag":"","tagUrl":"","title":"11111乐视云发布会盛大开启 杨永强致欢迎辞","tvPic":"http://i1.letvimg.com/lc02_isvrs/201509/06/10/17/12459112-7ac3-4e99-97c9-ae919fa1a549/thumb/2_400_300.jpg","type":1,"url":"http://www.letv.com/ptv/vplay/23324212.html","video":{"actorPlay":"","adPoint":"","alias":"","area":{"50001":"中国大陆"},"areaId":"1","areaName":"中国大陆","btime":0,"catchPlay":0,"category":{"3":"娱乐"},"chanName":"娱乐","cid":"3","controlAreas":"","createTime":"2015-08-18 14:34:03","cutoffPlatform":"","deleted":0,"description":"乐视云发布会盛大开启 杨永强致欢迎辞","diffDownload":0,"direction":0,"dolbyFlag":0,"downloadPlatform":{"290001":"Web","290003":"手机","290002":"Pad","290005":"TV"},"duration":273,"entAlbumTypeId":"","entAlbumTypeName":"","entOrder":0,"episode":"","etime":0,"firstPlayTime":"","h5Pic":"","id":23324212,"isHomemade":0,"isNarrow":"0","isshowepisode":0,"issue":0,"issueCompany":"","maker":"","matchId":0,"mid":",34084294,","mmsid":"34084294","musicAuthors":"","musicCompose":"","nameCn":"乐视云发布会盛大开启 杨永强致欢迎辞","namePinyinAbb":"l","nextChapter":0,"officialUrl":"","picAll":{"1080*608":"http://i0.letvimg.com/lc03_isvrs/201508/18/15/07/e5f6f97c-491c-4257-ac48-b0e331cf3643/thumb/2_1080_608.jpg","120*160":"http://i3.letvimg.com/lc03_yunzhuanma/201508/18/14/34/cd9d501f62d14186d429ba14df627122_34084294/thumb/5_120_160.jpg","120*90":"http://i0.letvimg.com/lc03_isvrs/201508/18/15/07/e5f6f97c-491c-4257-ac48-b0e331cf3643/thumb/2_120_90.jpg","128*96":"http://i0.letvimg.com/lc03_isvrs/201508/18/15/07/e5f6f97c-491c-4257-ac48-b0e331cf3643/thumb/2_128_96.jpg","1280*480":"http://i0.letvimg.com/lc03_isvrs/201508/18/15/07/e5f6f97c-491c-4257-ac48-b0e331cf3643/thumb/2_1280_480.jpg","1280*880":"http://i0.letvimg.com/lc03_isvrs/201508/18/15/07/e5f6f97c-491c-4257-ac48-b0e331cf3643/thumb/2_1280_880.jpg","132*99":"http://i0.letvimg.com/lc03_isvrs/201508/18/15/07/e5f6f97c-491c-4257-ac48-b0e331cf3643/thumb/2_132_99.jpg","150*200":"http://i3.letvimg.com/lc03_yunzhuanma/201508/18/14/34/cd9d501f62d14186d429ba14df627122_34084294/thumb/5_150_200.jpg","160*120":"http://i0.letvimg.com/lc03_isvrs/201508/18/15/07/e5f6f97c-491c-4257-ac48-b0e331cf3643/thumb/2_160_120.jpg","180*135":"http://i0.letvimg.com/lc03_isvrs/201508/18/15/07/e5f6f97c-491c-4257-ac48-b0e331cf3643/thumb/2_180_135.jpg","200*150":"http://i0.letvimg.com/lc03_isvrs/201508/18/15/07/e5f6f97c-491c-4257-ac48-b0e331cf3643/thumb/2_200_150.jpg","300*400":"http://i3.letvimg.com/lc03_yunzhuanma/201508/18/14/34/cd9d501f62d14186d429ba14df627122_34084294/thumb/5_300_400.jpg","320*200":"http://i0.letvimg.com/lc03_isvrs/201508/18/15/07/e5f6f97c-491c-4257-ac48-b0e331cf3643/thumb/2_320_200.jpg","320*480":"http://i1.letvimg.com/lc02_yunzhuanma/201508/19/03/07/ad370505e8dfed9bf6b74e47b4fad75f_34084294/thumb/2_320_480.jpg","400*225":"http://i0.letvimg.com/lc03_isvrs/201508/18/15/07/e5f6f97c-491c-4257-ac48-b0e331cf3643/thumb/2_400_225.jpg","400*250":"http://i0.letvimg.com/lc03_isvrs/201508/18/15/07/e5f6f97c-491c-4257-ac48-b0e331cf3643/thumb/2_400_250.jpg","400*300":"http://i0.letvimg.com/lc03_isvrs/201508/18/15/07/e5f6f97c-491c-4257-ac48-b0e331cf3643/thumb/2_400_300.jpg","640*240":"http://i0.letvimg.com/lc03_isvrs/201508/18/15/07/e5f6f97c-491c-4257-ac48-b0e331cf3643/thumb/2_640_240.jpg","640*440":"http://i0.letvimg.com/lc03_isvrs/201508/18/15/07/e5f6f97c-491c-4257-ac48-b0e331cf3643/thumb/2_640_440.jpg","640*960":"http://i1.letvimg.com/lc02_yunzhuanma/201508/19/03/07/ad370505e8dfed9bf6b74e47b4fad75f_34084294/thumb/2_640_960.jpg","90*120":"http://i3.letvimg.com/lc03_yunzhuanma/201508/18/14/34/cd9d501f62d14186d429ba14df627122_34084294/thumb/5_90_120.jpg","960*540":"http://i0.letvimg.com/lc03_isvrs/201508/18/15/07/e5f6f97c-491c-4257-ac48-b0e331cf3643/thumb/2_960_540.jpg"},"pid":10012054,"playControlPlatformCntv":"1","playControlPlatformGuoguang":"1","playControlPlatformHuashu":"1","playDuration":"04:33","playPlatform":{"420001":"Web","420003":"手机","420005":"Pad","420007":"TV"},"porder":10,"quality":"","recordCompany":"","relatedContent":"","relatedtype":"0","relativeContent":"","releaseDate":"2015-08-18","relevantVideoCounts":0,"remark":"","revMsgTime":0,"school":"","score":0,"shortDesc":"","singer":"","singleName":"","sourceId":{"200001":"网站"},"sourceName":"网站","startringPlay":"","styleId":"182233","styleName":"短视频","subCateName":"其他","subCategory":{"442002":"其他"},"subTitle":"杨永强致欢迎辞","subcid":442002,"tag":"乐视云发布会 乐视云 蜕变 发布会 杨永强 吴亚洲 张昭 吕征宇 阿木 张栋梁 超级手机 超级电视 超级汽车   乐Max 乐1 乐1Pro","titleCnt":0,"updateTime":"2015-08-19 16:21:46","url":"http://www.letv.com/ptv/vplay/23324212.html","userId":0,"videoPic":"http://i0.letvimg.com/lc03_isvrs/201508/18/15/07/e5f6f97c-491c-4257-ac48-b0e331cf3643/thumb/2_320_200.jpg","videoType":{"182233":"短视频"},"videoTypeName":"短视频","videocode":{"34084294":[{"code":{"9":"mp4"},"status":"300006"},{"code":{"13":"mp4_800"},"status":"300006"},{"code":{"21":"mp4_350"},"status":"300006"},{"code":{"22":"mp4_1300"},"status":"300006"},{"code":{"51":"mp4_720p"},"status":"300006"},{"code":{"52":"mp4_1080p3m"},"status":"300006"},{"code":{"53":"mp4_1080p6m"},"status":"300006"},{"code":{"58":"mp4_180"},"status":"300006"},{"code":{"124":"mp4_180_logo"},"status":"300006"},{"code":{"125":"mp4_350_logo"},"status":"300006"},{"code":{"126":"mp4_800_logo"},"status":"300006"}]},"viki":"","vikiFlag":0,"watchingFocus":[],"zongyiTitleCnt":0}});
                        //     res.data.blockContent.unshift({"androidUrl":"","bid":4237,"cityLevel":"0","cityWhiteList":"","content":"23324212","ctime":1441160152000,"endTime":"","extendJson":{"extendCid":"","extendPage":"","extendPicAll":{"pic169":"http://i1.letvimg.com/lc02_isvrs/201509/05/10/45/82fa94a5-d6a4-4290-8392-7babab7accac.jpg"},"extendPid":"","extendRange":"1","extendSubscript":"65","extendZid":""},"id":3,"iosUrl":"","mobilePic":"http://i0.letvimg.com/lc03_isvrs/201508/18/15/07/e5f6f97c-491c-4257-ac48-b0e331cf3643/thumb/2_400_300.jpg","mtime":1441503558000,"padPic":"http://i0.letvimg.com/lc03_isvrs/201508/18/15/07/e5f6f97c-491c-4257-ac48-b0e331cf3643/thumb/2_400_300.jpg","pic1":"http://i0.letvimg.com/lc03_isvrs/201508/18/15/07/e5f6f97c-491c-4257-ac48-b0e331cf3643/thumb/2_200_150.jpg","pic2":"http://i0.letvimg.com/lc03_isvrs/201508/18/15/07/e5f6f97c-491c-4257-ac48-b0e331cf3643/thumb/2_200_150.jpg","picList":{"1440x810":"","400x225":"http://i0.letvimg.com/lc03_isvrs/201508/18/15/07/e5f6f97c-491c-4257-ac48-b0e331cf3643/thumb/2_400_225.jpg","400x250":"","400x300":"","960x540":"http://i0.letvimg.com/lc03_isvrs/201508/18/15/07/e5f6f97c-491c-4257-ac48-b0e331cf3643/thumb/2_960_540.jpg","mobilePic":"http://i0.letvimg.com/lc03_isvrs/201508/18/15/07/e5f6f97c-491c-4257-ac48-b0e331cf3643/thumb/2_400_300.jpg","padPic":"http://i0.letvimg.com/lc03_isvrs/201508/18/15/07/e5f6f97c-491c-4257-ac48-b0e331cf3643/thumb/2_400_300.jpg","pic1":"http://i0.letvimg.com/lc03_isvrs/201508/18/15/07/e5f6f97c-491c-4257-ac48-b0e331cf3643/thumb/2_200_150.jpg","pic2":"http://i0.letvimg.com/lc03_isvrs/201508/18/15/07/e5f6f97c-491c-4257-ac48-b0e331cf3643/thumb/2_200_150.jpg","tvPic":"http://i0.e5f6f97c-491c-4257-ac48-b0e331cf3643/thumb/2_400_300.jpg"},"playControlPlatform":"1,2,3","playCount":2640,"playPlatform":{"420001":"Web","420003":"IOS","420003_1":"Android","420005":"Pad","420007":"TV"},"position":"2015-8-2","priority":1,"provinceWhiteList":"","pushflag":"420001,420003,420003_1,420005,420007","remark":"07:35","shorDesc":"第二条数据展示","showTag":"","showTagList":[],"skipPage":"","skipType":1,"skipUrl":"","startTime":"","subTitle":"乐视云发布会盛大开启 杨永强致欢迎辞","tag":"","tagUrl":"","title":"2222乐视云发布会盛大开启 杨永强致欢迎辞","tvPic":"http://i1.letvimg.com/lc02_isvrs/201509/06/10/17/12459112-7ac3-4e99-97c9-ae919fa1a549/thumb/2_400_300.jpg","type":1,"url":"http://www.letv.com/ptv/vplay/23324212.html","video":{"actorPlay":"","adPoint":"","alias":"","area":{"50001":"中国大陆"},"areaId":"1","areaName":"中国大陆","btime":0,"catchPlay":0,"category":{"3":"娱乐"},"chanName":"娱乐","cid":"3","controlAreas":"","createTime":"2015-08-18 14:34:03","cutoffPlatform":"","deleted":0,"description":"乐视云发布会盛大开启 杨永强致欢迎辞","diffDownload":0,"direction":0,"dolbyFlag":0,"downloadPlatform":{"290001":"Web","290003":"手机","290002":"Pad","290005":"TV"},"duration":273,"entAlbumTypeId":"","entAlbumTypeName":"","entOrder":0,"episode":"","etime":0,"firstPlayTime":"","h5Pic":"","id":23324212,"isHomemade":0,"isNarrow":"0","isshowepisode":0,"issue":0,"issueCompany":"","maker":"","matchId":0,"mid":",34084294,","mmsid":"34084294","musicAuthors":"","musicCompose":"","nameCn":"乐视云发布会盛大开启 杨永强致欢迎辞","namePinyinAbb":"l","nextChapter":0,"officialUrl":"","picAll":{"1080*608":"http://i0.letvimg.com/lc03_isvrs/201508/18/15/07/e5f6f97c-491c-4257-ac48-b0e331cf3643/thumb/2_1080_608.jpg","120*160":"http://i3.letvimg.com/lc03_yunzhuanma/201508/18/14/34/cd9d501f62d14186d429ba14df627122_34084294/thumb/5_120_160.jpg","120*90":"http://i0.letvimg.com/lc03_isvrs/201508/18/15/07/e5f6f97c-491c-4257-ac48-b0e331cf3643/thumb/2_120_90.jpg","128*96":"http://i0.letvimg.com/lc03_isvrs/201508/18/15/07/e5f6f97c-491c-4257-ac48-b0e331cf3643/thumb/2_128_96.jpg","1280*480":"http://i0.letvimg.com/lc03_isvrs/201508/18/15/07/e5f6f97c-491c-4257-ac48-b0e331cf3643/thumb/2_1280_480.jpg","1280*880":"http://i0.letvimg.com/lc03_isvrs/201508/18/15/07/e5f6f97c-491c-4257-ac48-b0e331cf3643/thumb/2_1280_880.jpg","132*99":"http://i0.letvimg.com/lc03_isvrs/201508/18/15/07/e5f6f97c-491c-4257-ac48-b0e331cf3643/thumb/2_132_99.jpg","150*200":"http://i3.letvimg.com/lc03_yunzhuanma/201508/18/14/34/cd9d501f62d14186d429ba14df627122_34084294/thumb/5_150_200.jpg","160*120":"http://i0.letvimg.com/lc03_isvrs/201508/18/15/07/e5f6f97c-491c-4257-ac48-b0e331cf3643/thumb/2_160_120.jpg","180*135":"http://i0.letvimg.com/lc03_isvrs/201508/18/15/07/e5f6f97c-491c-4257-ac48-b0e331cf3643/thumb/2_180_135.jpg","200*150":"http://i0.letvimg.com/lc03_isvrs/201508/18/15/07/e5f6f97c-491c-4257-ac48-b0e331cf3643/thumb/2_200_150.jpg","300*400":"http://i3.letvimg.com/lc03_yunzhuanma/201508/18/14/34/cd9d501f62d14186d429ba14df627122_34084294/thumb/5_300_400.jpg","320*200":"http://i0.letvimg.com/lc03_isvrs/201508/18/15/07/e5f6f97c-491c-4257-ac48-b0e331cf3643/thumb/2_320_200.jpg","320*480":"http://i1.letvimg.com/lc02_yunzhuanma/201508/19/03/07/ad370505e8dfed9bf6b74e47b4fad75f_34084294/thumb/2_320_480.jpg","400*225":"http://i0.letvimg.com/lc03_isvrs/201508/18/15/07/e5f6f97c-491c-4257-ac48-b0e331cf3643/thumb/2_400_225.jpg","400*250":"http://i0.letvimg.com/lc03_isvrs/201508/18/15/07/e5f6f97c-491c-4257-ac48-b0e331cf3643/thumb/2_400_250.jpg","400*300":"http://i0.letvimg.com/lc03_isvrs/201508/18/15/07/e5f6f97c-491c-4257-ac48-b0e331cf3643/thumb/2_400_300.jpg","640*240":"http://i0.letvimg.com/lc03_isvrs/201508/18/15/07/e5f6f97c-491c-4257-ac48-b0e331cf3643/thumb/2_640_240.jpg","640*440":"http://i0.letvimg.com/lc03_isvrs/201508/18/15/07/e5f6f97c-491c-4257-ac48-b0e331cf3643/thumb/2_640_440.jpg","640*960":"http://i1.letvimg.com/lc02_yunzhuanma/201508/19/03/07/ad370505e8dfed9bf6b74e47b4fad75f_34084294/thumb/2_640_960.jpg","90*120":"http://i3.letvimg.com/lc03_yunzhuanma/201508/18/14/34/cd9d501f62d14186d429ba14df627122_34084294/thumb/5_90_120.jpg","960*540":"http://i0.letvimg.com/lc03_isvrs/201508/18/15/07/e5f6f97c-491c-4257-ac48-b0e331cf3643/thumb/2_960_540.jpg"},"pid":10012054,"playControlPlatformCntv":"1","playControlPlatformGuoguang":"1","playControlPlatformHuashu":"1","playDuration":"04:33","playPlatform":{"420001":"Web","420003":"手机","420005":"Pad","420007":"TV"},"porder":10,"quality":"","recordCompany":"","relatedContent":"","relatedtype":"0","relativeContent":"","releaseDate":"2015-08-18","relevantVideoCounts":0,"remark":"","revMsgTime":0,"school":"","score":0,"shortDesc":"","singer":"","singleName":"","sourceId":{"200001":"网站"},"sourceName":"网站","startringPlay":"","styleId":"182233","styleName":"短视频","subCateName":"其他","subCategory":{"442002":"其他"},"subTitle":"杨永强致欢迎辞","subcid":442002,"tag":"乐视云发布会 乐视云 蜕变 发布会 杨永强 吴亚洲 张昭 吕征宇 阿木 张栋梁 超级手机 超级电视 超级汽车   乐Max 乐1 乐1Pro","titleCnt":0,"updateTime":"2015-08-19 16:21:46","url":"http://www.letv.com/ptv/vplay/23324212.html","userId":0,"videoPic":"http://i0.letvimg.com/lc03_isvrs/201508/18/15/07/e5f6f97c-491c-4257-ac48-b0e331cf3643/thumb/2_320_200.jpg","videoType":{"182233":"短视频"},"videoTypeName":"短视频","videocode":{"34084294":[{"code":{"9":"mp4"},"status":"300006"},{"code":{"13":"mp4_800"},"status":"300006"},{"code":{"21":"mp4_350"},"status":"300006"},{"code":{"22":"mp4_1300"},"status":"300006"},{"code":{"51":"mp4_720p"},"status":"300006"},{"code":{"52":"mp4_1080p3m"},"status":"300006"},{"code":{"53":"mp4_1080p6m"},"status":"300006"},{"code":{"58":"mp4_180"},"status":"300006"},{"code":{"124":"mp4_180_logo"},"status":"300006"},{"code":{"125":"mp4_350_logo"},"status":"300006"},{"code":{"126":"mp4_800_logo"},"status":"300006"}]},"viki":"","vikiFlag":0,"watchingFocus":[],"zongyiTitleCnt":0}});
                        //     res.data.blockContent.unshift({"androidUrl":"","bid":4237,"cityLevel":"0","cityWhiteList":"","content":"23324212","ctime":1441160152000,"endTime":"","extendJson":{"extendCid":"","extendPage":"","extendPicAll":{"pic169":"http://i1.letvimg.com/lc02_isvrs/201509/05/10/45/82fa94a5-d6a4-4290-8392-7babab7accac.jpg"},"extendPid":"","extendRange":"1","extendSubscript":"65","extendZid":""},"id":4,"iosUrl":"","mobilePic":"http://i0.letvimg.com/lc03_isvrs/201508/18/15/07/e5f6f97c-491c-4257-ac48-b0e331cf3643/thumb/2_400_300.jpg","mtime":1441503558000,"padPic":"http://i0.letvimg.com/lc03_isvrs/201508/18/15/07/e5f6f97c-491c-4257-ac48-b0e331cf3643/thumb/2_400_300.jpg","pic1":"http://i0.letvimg.com/lc03_isvrs/201508/18/15/07/e5f6f97c-491c-4257-ac48-b0e331cf3643/thumb/2_200_150.jpg","pic2":"http://i0.letvimg.com/lc03_isvrs/201508/18/15/07/e5f6f97c-491c-4257-ac48-b0e331cf3643/thumb/2_200_150.jpg","picList":{"1440x810":"","400x225":"http://i0.letvimg.com/lc03_isvrs/201508/18/15/07/e5f6f97c-491c-4257-ac48-b0e331cf3643/thumb/2_400_225.jpg","400x250":"","400x300":"","960x540":"http://i0.letvimg.com/lc03_isvrs/201508/18/15/07/e5f6f97c-491c-4257-ac48-b0e331cf3643/thumb/2_960_540.jpg","mobilePic":"http://i0.letvimg.com/lc03_isvrs/201508/18/15/07/e5f6f97c-491c-4257-ac48-b0e331cf3643/thumb/2_400_300.jpg","padPic":"http://i0.letvimg.com/lc03_isvrs/201508/18/15/07/e5f6f97c-491c-4257-ac48-b0e331cf3643/thumb/2_400_300.jpg","pic1":"http://i0.letvimg.com/lc03_isvrs/201508/18/15/07/e5f6f97c-491c-4257-ac48-b0e331cf3643/thumb/2_200_150.jpg","pic2":"http://i0.letvimg.com/lc03_isvrs/201508/18/15/07/e5f6f97c-491c-4257-ac48-b0e331cf3643/thumb/2_200_150.jpg","tvPic":"http://i0.letvimg.com/lc03_isvrs/201508/18/15/07/e5f6f97c-491c-4257-ac48-b0e331cf3643/thumb/2_400_300.jpg"},"playControlPlatform":"1,2,3","playCount":2640,"playPlatform":{"420001":"Web","420003":"IOS","420003_1":"Android","420005":"Pad","420007":"TV"},"position":"2015-8-2","priority":1,"provinceWhiteList":"","pushflag":"420001,420003,420003_1,420005,420007","remark":"07:35","shorDesc":"第一条最新的数据","showTag":"","showTagList":[],"skipPage":"","skipType":1,"skipUrl":"","startTime":"","subTitle":"乐视云发布会盛大开启 杨永强致欢迎辞","tag":"","tagUrl":"","title":"11111乐视云发布会盛大开启 杨永强致欢迎辞","tvPic":"http://i1.letvimg.com/lc02_isvrs/201509/06/10/17/12459112-7ac3-4e99-97c9-ae919fa1a549/thumb/2_400_300.jpg","type":1,"url":"http://www.letv.com/ptv/vplay/23324212.html","video":{"actorPlay":"","adPoint":"","alias":"","area":{"50001":"中国大陆"},"areaId":"1","areaName":"中国大陆","btime":0,"catchPlay":0,"category":{"3":"娱乐"},"chanName":"娱乐","cid":"3","controlAreas":"","createTime":"2015-08-18 14:34:03","cutoffPlatform":"","deleted":0,"description":"乐视云发布会盛大开启 杨永强致欢迎辞","diffDownload":0,"direction":0,"dolbyFlag":0,"downloadPlatform":{"290001":"Web","290003":"手机","290002":"Pad","290005":"TV"},"duration":273,"entAlbumTypeId":"","entAlbumTypeName":"","entOrder":0,"episode":"","etime":0,"firstPlayTime":"","h5Pic":"","id":23324212,"isHomemade":0,"isNarrow":"0","isshowepisode":0,"issue":0,"issueCompany":"","maker":"","matchId":0,"mid":",34084294,","mmsid":"34084294","musicAuthors":"","musicCompose":"","nameCn":"乐视云发布会盛大开启 杨永强致欢迎辞","namePinyinAbb":"l","nextChapter":0,"officialUrl":"","picAll":{"1080*608":"http://i0.letvimg.com/lc03_isvrs/201508/18/15/07/e5f6f97c-491c-4257-ac48-b0e331cf3643/thumb/2_1080_608.jpg","120*160":"http://i3.letvimg.com/lc03_yunzhuanma/201508/18/14/34/cd9d501f62d14186d429ba14df627122_34084294/thumb/5_120_160.jpg","120*90":"http://i0.letvimg.com/lc03_isvrs/201508/18/15/07/e5f6f97c-491c-4257-ac48-b0e331cf3643/thumb/2_120_90.jpg","128*96":"http://i0.letvimg.com/lc03_isvrs/201508/18/15/07/e5f6f97c-491c-4257-ac48-b0e331cf3643/thumb/2_128_96.jpg","1280*480":"http://i0.letvimg.com/lc03_isvrs/201508/18/15/07/e5f6f97c-491c-4257-ac48-b0e331cf3643/thumb/2_1280_480.jpg","1280*880":"http://i0.letvimg.com/lc03_isvrs/201508/18/15/07/e5f6f97c-491c-4257-ac48-b0e331cf3643/thumb/2_1280_880.jpg","132*99":"http://i0.letvimg.com/lc03_isvrs/201508/18/15/07/e5f6f97c-491c-4257-ac48-b0e331cf3643/thumb/2_132_99.jpg","150*200":"http://i3.letvimg.com/lc03_yunzhuanma/201508/18/14/34/cd9d501f62d14186d429ba14df627122_34084294/thumb/5_150_200.jpg","160*120":"http://i0.letvimg.com/lc03_isvrs/201508/18/15/07/e5f6f97c-491c-4257-ac48-b0e331cf3643/thumb/2_160_120.jpg","180*135":"http://i0.letvimg.com/lc03_isvrs/201508/18/15/07/e5f6f97c-491c-4257-ac48-b0e331cf3643/thumb/2_180_135.jpg","200*150":"http://i0.letvimg.com/lc03_isvrs/201508/18/15/07/e5f6f97c-491c-4257-ac48-b0e331cf3643/thumb/2_200_150.jpg","300*400":"http://i3.letvimg.com/lc03_yunzhuanma/201508/18/14/34/cd9d501f62d14186d429ba14df627122_34084294/thumb/5_300_400.jpg","320*200":"http://i0.letvimg.com/lc03_isvrs/201508/18/15/07/e5f6f97c-491c-4257-ac48-b0e331cf3643/thumb/2_320_200.jpg","320*480":"http://i1.letvimg.com/lc02_yunzhuanma/201508/19/03/07/ad370505e8dfed9bf6b74e47b4fad75f_34084294/thumb/2_320_480.jpg","400*225":"http://i0.letvimg.com/lc03_isvrs/201508/18/15/07/e5f6f97c-491c-4257-ac48-b0e331cf3643/thumb/2_400_225.jpg","400*250":"http://i0.letvimg.com/lc03_isvrs/201508/18/15/07/e5f6f97c-491c-4257-ac48-b0e331cf3643/thumb/2_400_250.jpg","400*300":"http://i0.letvimg.com/lc03_isvrs/201508/18/15/07/e5f6f97c-491c-4257-ac48-b0e331cf3643/thumb/2_400_300.jpg","640*240":"http://i0.letvimg.com/lc03_isvrs/201508/18/15/07/e5f6f97c-491c-4257-ac48-b0e331cf3643/thumb/2_640_240.jpg","640*440":"http://i0.letvimg.com/lc03_isvrs/201508/18/15/07/e5f6f97c-491c-4257-ac48-b0e331cf3643/thumb/2_640_440.jpg","640*960":"http://i1.letvimg.com/lc02_yunzhuanma/201508/19/03/07/ad370505e8dfed9bf6b74e47b4fad75f_34084294/thumb/2_640_960.jpg","90*120":"http://i3.letvimg.com/lc03_yunzhuanma/201508/18/14/34/cd9d501f62d14186d429ba14df627122_34084294/thumb/5_90_120.jpg","960*540":"http://i0.letvimg.com/lc03_isvrs/201508/18/15/07/e5f6f97c-491c-4257-ac48-b0e331cf3643/thumb/2_960_540.jpg"},"pid":10012054,"playControlPlatformCntv":"1","playControlPlatformGuoguang":"1","playControlPlatformHuashu":"1","playDuration":"04:33","playPlatform":{"420001":"Web","420003":"手机","420005":"Pad","420007":"TV"},"porder":10,"quality":"","recordCompany":"","relatedContent":"","relatedtype":"0","relativeContent":"","releaseDate":"2015-08-18","relevantVideoCounts":0,"remark":"","revMsgTime":0,"school":"","score":0,"shortDesc":"","singer":"","singleName":"","sourceId":{"200001":"网站"},"sourceName":"网站","startringPlay":"","styleId":"182233","styleName":"短视频","subCateName":"其他","subCategory":{"442002":"其他"},"subTitle":"杨永强致欢迎辞","subcid":442002,"tag":"乐视云发布会 乐视云 蜕变 发布会 杨永强 吴亚洲 张昭 吕征宇 阿木 张栋梁 超级手机 超级电视 超级汽车   乐Max 乐1 乐1Pro","titleCnt":0,"updateTime":"2015-08-19 16:21:46","url":"http://www.letv.com/ptv/vplay/23324212.html","userId":0,"videoPic":"http://i0.letvimg.com/lc03_isvrs/201508/18/15/07/e5f6f97c-491c-4257-ac48-b0e331cf3643/thumb/2_320_200.jpg","videoType":{"182233":"短视频"},"videoTypeName":"短视频","videocode":{"34084294":[{"code":{"9":"mp4"},"status":"300006"},{"code":{"13":"mp4_800"},"status":"300006"},{"code":{"21":"mp4_350"},"status":"300006"},{"code":{"22":"mp4_1300"},"status":"300006"},{"code":{"51":"mp4_720p"},"status":"300006"},{"code":{"52":"mp4_1080p3m"},"status":"300006"},{"code":{"53":"mp4_1080p6m"},"status":"300006"},{"code":{"58":"mp4_180"},"status":"300006"},{"code":{"124":"mp4_180_logo"},"status":"300006"},{"code":{"125":"mp4_350_logo"},"status":"300006"},{"code":{"126":"mp4_800_logo"},"status":"300006"}]},"viki":"","vikiFlag":0,"watchingFocus":[],"zongyiTitleCnt":0}});
                        // }
                        var idArr = [];
                        $.each(res.data.blockContent, function(index, item){
                            idArr.push(item.id);
                        });
                        //此处添加判断条件，看接口返回的数据id数组是否一致
                        if(that.liveData.length === 0){
                            that.render(wrap,res.data);
                            that.liveData = idArr;
                        }else{
                            var newArr = _.union(that.liveData, idArr);
                            var newLen = newArr.length;
                            var oldLen = that.liveData.length;
                            if(newLen > 0 && newLen > oldLen){
                                var addList = newArr.slice(oldLen);
                                var tempObj = $.extend(res.data,{});
                                if(tempObj.blockContent){
                                    var list = [];
                                    $.each(addList,function(index, im){
                                        $.each(tempObj.blockContent, function(idx, item){
                                            if(im === item.id){
                                                list.push(item);
                                            }
                                        });
                                    });
                                    if(list.length === addList.length){
                                        tempObj.blockContent = list;
                                    }
                                    that.render(wrap,tempObj,'add');
                                    that.liveData = idArr;
                                }
                            }
                        }
                    }
                },
                error : function(res){
                    if(first){
                        $('.data_box').show();
                        $('.loadBox1').hide();
                    }
                }
            });
        },
        render : function(wrap,data,type){
            var that = this;
            var tpl = Hogan.compile(that.TPL);
            var hml = tpl.render(that.formateJson(data));
            if(type){
                wrap.prepend('<div data-js="wrap_'+ that.configOptions.blockId+'">' + hml + '</div>');
                var jsWrap = $('[data-js="wrap_'+ that.configOptions.blockId +'"]');
                that.newDataAnimation(jsWrap);
            }else{
                wrap.html(hml);
            }
            Zepto('img[data-url]').imglazyload();
        },
        newDataAnimation : function(wrap){
            var blocks = wrap.find('.ztm_cnt');
            blocks.css({
                'opacity':'0'
            });
            $.each(blocks,function(idx, im){
                var hg = $(im).height();
                $(im).attr('data-height',hg);
            });
            blocks.hide();
            blocks.css({
                'height':'0px'
            });
            blocks = Array.prototype.slice.call(blocks).reverse();
            var flag = 0;
            var updateTimer = setInterval(function(){
                if(flag === blocks.length){
                    clearInterval(updateTimer);
                    return;
                }
                var curr = $(blocks[flag]);
                curr.show();
                curr.css({
                    'opacity':1,
                    'height': curr.attr('data-height') + 'px'
                });
                flag++;
            },3000);
        },
        formateJson : function(json){
            var that = this;
            var obj = $.extend(json,{});
            var style = that.configOptions.style;
            if(obj.blockContent && obj.blockContent.length > 0){
                $.each(obj.blockContent, function(index, item){
                    var time = new Date(item.ctime);
                    if(!item.remark){
                        item.remark = utils.formateHM(time);
                    }
                    if(!item.position){
                        item.position = utils.formateYMD(time);
                    }
                    if(!item.url){
                        item.url = 0;
                    }
                    var num = item.extendJson.extendSubscript;
                    switch (num){
                        case '64':
                            item.js_pics = [{pic:item.tvPic,flag:1}, {pic:item.extendJson.extendPicAll.pic169, flag:1},{pic:item.picList['960x540'],flag:1},{pic:item.picList['1440x810'],flag:1}];
                            break;
                        case '65':
                            item.js_pics = [{pic:item.tvPic,flag:1}, {pic:item.extendJson.extendPicAll.pic169, flag:1}];
                            break;
                        case '66':
                            item.js_pics = [{pic:item.tvPic,flag:1}];
                            break;
                        case '67':
                            item.js_pics = [];
                            break;
                        case '68':
                            item.js_pics = [{pic:item.tvPic,flag:1}, {pic:item.extendJson.extendPicAll.pic169, flag:1},{pic:item.picList['960x540'],flag:0}];
                            break;
                    }
                });
            }
            return obj;
        }
    };
    module.exports = picTextLiveDirComp;
});