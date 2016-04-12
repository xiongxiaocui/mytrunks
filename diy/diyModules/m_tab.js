define(function (require, exports, module) {
	var Tab = function($slider,opt){
		this._sliderWrapper = typeof $slider ==='string' ? $($slider) : $slider;
		this.options = $.extend({
			navs: "",
			cons: "",
			flag: "0"
		},opt);
		this.init();
		this.indexShow();
	};
	Tab.prototype = {
		init:function(){
			var self = this;
			if (self.options.navs && self.options.cons) {
				self.options.navs.on("click",function(){
					$(this).addClass("active").siblings().removeClass("active");
					self.options.cons.eq($(this).index()).show().siblings("div").hide();
				});
			}
		},
		indexShow:function(){
			if (this.options.flag) {
				this.options.cons.eq(parseInt(this.options.flag)).show();
			}
		}
	};
	module.exports = Tab;
});
