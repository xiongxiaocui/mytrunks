/**
 * @fileoverview 2015 点击查看大图组件
 * @authors liuxiaoyue3@letv.com
 * @date 20150910
 */
__req("lib::iscroll/iscroll_v513.js");
define(function(require,exports,module){
	var events = require('./../events');
	var Overlay = require('air/ui/overlay');
	var _elementStyle = document.createElement('div').style;
	var pageWrap = $('.layout');

	//常用工具函数
	var utils = {
		getWinHeight:function(){
			return window.innerHeight;
		},
		getWinWidth : function(){
			return window.innerWidth;
		},
		vendor : function(){
			var vendors = ['t', 'webkitT', 'MozT', 'msT', 'OT'],
				transform,
				i = 0,
				l = vendors.length;
			for ( ; i < l; i++ ) {
				transform = vendors[i] + 'ransform';
				if ( transform in _elementStyle ) return vendors[i].substr(0, vendors[i].length-1);
			}
			return false;
		},
		transform : function(style){
			var _elementStyle = document.createElement('div').style;
			var _vendor = utils.vendor();
			if ( _vendor === false ) return false;
			if ( _vendor === '' ) return style;
			return _vendor + style.charAt(0).toUpperCase() + style.substr(1);
		},
		imgLoad : function(url,fn){
			var img = new Image();
			img.onload = function(){
				fn();
			};
			img.src = url;
		},
	};

	var transition = utils.transform('transition');

	function picShow(options){
		this.opts = this.initOptions(options);
		this.initEvent(this.opts.el);

		//如果是在通用直播页，则需要替换展位图
		var bgImgUrl='http://i3.letvimg.com/lc04_img/201601/07/17/18/img16V9.png';
		if(info.pageid&&info.pageid==='live/play'){
			bgImgUrl='http://i1.letvimg.com/lc06_img/201603/09/15/55/img16V9.png';
		}

		this.TPL = [
			'<div data-wrap="wrapper" style="width:100%;height:100%;">',
				'<div class="graphic_img_big">',
					'<ul style="width:{{list.length}}00%;-webkit-transform:translate(-{{translateX}}px,0) translateZ(0);transform:translate(-{{translateX}}px,0) translateZ(0);">',
						'{{#list}}',
						'<li style="width:{{percent}}%;{{#curPage}}opacity:0;{{/curPage}}" class="wrapper_{{idx}}">',
							'<div id="J_scroller_{{idx}}">',
								'<img src="'+bgImgUrl+'" data-url="{{newUrl}}"/>',
								'<small></small>',
							'</div>',
						'</li>',
						'{{/list}}',
					'</ul>',
					'<div class="page"><span data-page>{{curPic}}</span>/<span>{{list.length}}</span></div>',
					'<em class="ico_close"><a href="javascript:void(0);"><i class="i-1"></i><i class="i-2"></i></a></em>',
				'</div>',
			'</div>'
		].join('');
		//对播放器操作之前 重新设置此变量
		if(typeof window.__canControlPlayer ==='undefined') {
			window.__canControlPlayer = true;
		}
	}

	picShow.prototype = {
		initOptions : function(options){
			var opts = {
				el : '',
				curPage : ''
			};
			return $.extend(opts, options);
		},
		initEvent : function(el){
			el.delegate('.graphic_img > a', 'click',_.bind(this.initSlideFunc,this));
			$(window).on('ortchange', _.bind(this.layerMiddle,this));
		},
		initSlideFunc :function(e){
			if($(e.target).closest('a').attr('data-href')){
				return;
			}
			//此处隐藏页面整体区域，防止滑动大图时，图片渲染bug
			pageWrap.css('visibility','hidden');
			var that = this;
			that.preventDefault(e);
			that.toGoVideoPlayer('hide');
			//获取点击的图片列表 当前展示的第几张
			var data = this.getPicList(e);
			var tpl = Hogan.compile(this.TPL);
			var hml = tpl.render(data);
			var popLayer = new Overlay({
				html: hml,
				mask: 1,
				events: {
					'click .graphic_img_big': function(){
						this.close();
					},
					'touchmove .graphic_img_big': function(e){
						that.preventDefault(e);
					}
				},
				onClickMask: function(){
					this.close();
				},
				hideFn : function(){
					pageWrap.css('visibility','visible');
					events.emit('close-layer');
					events.off('close-layer');
					that.destory();
				},
				showFn : function(){
					this.$box.show();
					var chld = this.$box.find('.graphic_img_big');
					var url = chld.find('img')[0].src;
					//此处针对当前展示li实行透明度变换效果
					//在百度浏览器下，若对ul.parent()实行透明度，滑动图片，存在渲染bug
					var is = chld.find('li').get(that.opts.curPage - 1);
					that.transition(is,'opacity',0.5,'ease-out');
					//确保默认图加载完毕 才开始渲染图片 防止图片未加载成功，计算居中位置不正确
					utils.imgLoad(url,function(){
						that.layerMiddle();
						//此处添加延时处理，确保居中处理页面闪烁
						setTimeout(function(){
							$(is).css({
								opacity : 1
							});
						});
					});
				}
			});
			popLayer.setMiddle();
			$('img[data-url]').imglazyload();
            events.on('close-layer',function(){
				if(popLayer){
					popLayer = null;
				}
			});
		},
		toGoVideoPlayer : function(status){
			if(window.__canControlPlayer) {
				var video = $('video'),
					player;
				if(video.length){
					player = video.parent().parent();
					if(!window.__canControlPlayer) return;
					if(status === 'hide'){
						player.css('top','-5000px');
					}else{
						player.css('top','0px');
					}
				}
			}
		},
		getPicList : function(evt){
			var that = this;
			var obj = {
				list : []
			};
			var target = $(evt.currentTarget);
			target.find('small').attr('current','1');
			var list = target.parent().children().find('small');
			var percent = (1/list.length)*100;
			//此变量用来针对当前展示图片实行透明效果
			var curFlag;
            $.each(list,function(idx,item){
				if($(item).attr('current')){
					obj.curPic = idx + 1;
					that.opts.curPage = idx + 1;
					$(item).removeAttr('current');
					curFlag = 1;
				}else{
					curFlag = 0;
				}
				var url = $(item).attr('data-origin');
				obj.list.push({
					percent : percent,
					newUrl : url + '/thumb/2_640_360.jpg',
					idx : idx + 1,
					curPage : curFlag
				});
            });
            that.opts.imgListLen = obj.list.length;
            //插入模版时计算位置，防止插入后在计算位置，页面存在跳动感
            obj.translateX = 1*(that.opts.curPage-1)*utils.getWinWidth();
			return obj;
		},
		destory : function(){
			var that = this;
			$('[data-wrap="wrapper"]').remove();
			this.opts.curPage = '';
			//先出现视频，浮层才消失，针对此特殊处理
			setTimeout(function(){
				that.toGoVideoPlayer('show');
			},500);
		},
		preventDefault : function(evt){
			if(evt){
				evt.preventDefault();
			}
		},
		//查看大图居中显示
		layerMiddle : function(e){
			//横竖屏切换，重新实例化组件
			var that = this;
			var wrap = $('[data-wrap="wrapper"]');
			if(wrap.length === 0){
				return;
			}
			var ul = wrap.find('ul');
			var is = ul.find('small');
			var imgs = ul.find('img');
			var winHei = utils.getWinHeight();
			var winWidth = utils.getWinWidth();
			var marTop;
			//此处计算位置之前清除transition 是因为在百度浏览器下
			//多次旋转屏幕会发现计算位置越来越慢 很有可能是为了执行动画引起的，所以此处动画清除
			ul[0].style[transition] = '';
			if(winWidth > winHei){
				marTop = (winHei - ul.height())/2 + 'px';
				ul.css({
					'top' : '0px'
				});
				//此处重新设置图片宽度 解决横屏的时候图片显示不全的bug
				imgs.css('width',(4*winHei)/3 + 'px');
				var imgWidth = imgs.width();
				imgs.css({
					'left' : (winWidth-imgWidth)/2 + 'px'
				});
				//设置 i 和 img 居中展示
				is.css({
					'width' : imgWidth + 'px',
					'left' : (winWidth-imgWidth)/2 + 'px'
				});
			}else{
				//此处存起来高度，是因为横竖屏切换的时候，ul的高度未及时变换，居中显示位置计算有误
				if(!this.bigPicHeight){
					this.bigPicHeight = ul.height();
				}
				marTop = (winHei - this.bigPicHeight)/2 + 'px';
				ul.css({
					'position' : 'absolute',
					'top' : marTop,
					'left' : '0px'
				});
				is.css({
					'width' : '100%',
					'left' : '0px'
				});
				imgs.css({
					'left' : '0px',
					'width' : '100%'
				});
			}
			this.prepareScroll();
		},
		prepareScroll : function(){
			var wrap = $('[data-wrap="wrapper"]');
			var opts = this.opts;
			this.flag = false;
			var ul = wrap.find('ul');
			opts.curSlider = ul[0];
			//横竖屏切换 滚动位置重新计算
			this.tranlate(opts.curSlider, -1*(opts.curPage-1)*utils.getWinWidth(),0,0);
			this.loadScroll(opts.curPage);
		},
		loadScroll : function(wrapId){
			var that = this;
			var wrap = $('.wrapper_' + wrapId)[0];
			var slide;
			if(slide){
				slide.destory();
				slide = null;
			}
			slide = new IScrollv513(wrap, {
				disableMouse:true,
				scrollX: true,
				scrollY: true,
				eventPassthrough : true
			});
			slide.on("flick",function(){
				if(this.hasHorizontalScroll || Math.abs(this.distY) > Math.abs(this.distX)){
					return;
				}
				if(this.distX > 0){
					that.prev();
				}else{
					that.next();
				}
			});
		},
		prev : function(){
			var that = this;
			var opts = this.opts;
			if(opts.curPage > 1){
				if(that.flag){
					return;
				}
				that.flag = true;
				opts.curPage--;
				//此处应该重新初始化iscroll实例
				this.loadScroll(opts.curPage);
				this.gotoPage();
			}
		},
		next : function(){
			var that = this;
			var opts = this.opts;
			if(opts.curPage < opts.imgListLen){
				if(that.flag){
					return;
				}
				that.flag = true;
				opts.curPage++;
				//此处应该重新初始化iscroll实例
				this.loadScroll(opts.curPage);
				this.gotoPage();
			}
		},
		gotoPage : function(){
			var that = this;
			var opts = this.opts;
			var clientW = utils.getWinWidth();
			this.transition(this.opts.curSlider,'all',0.3,'ease-out');
			this.tranlate(this.opts.curSlider, -1*(opts.curPage-1)*clientW ,0 ,0);
			$('[data-page]').html(opts.curPage);
			//确保动画执行完毕
			var curSlider = $(this.opts.curSlider);
			curSlider.on('webkitTransitionEnd TransitionEnd', function(){
				that.flag = false;
                curSlider.off('webkitAnimationEnd animationend');
            });
		},
		tranlate : function(el, x, y, z){
			var transform = utils.transform('transform');
			el.style[transform] = 'translate('+ x +'px,'+ y +'px) translateZ(0)';
		},
		transition : function(el,prop, time, cup){
			el.style[transition] = prop + ' ' + time +'s '+ cup;
		}
	};
	module.exports = picShow;
});
