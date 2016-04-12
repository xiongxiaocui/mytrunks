/**
 * M站diy数字翻滚动画组件
 */

define(function (require, exports, module) {
	'use strict';
	var Tpl = require('air/util/tpl');
	var ScrollNum = function () {
		this.numberDom = '';
	};
	ScrollNum.prototype = {
		/**
		 * 程序初始化入口
		 * @param config
		 */
		init: function (config) {
			this.initDom(config);
			this.initScrollNum();
		},

		/**
		 * 初始化DOM节点和变量
		 * @param config
		 * height: 数字所占的高度
		 * width: 数字所占的宽度
		 * showNum: 展示的数字（完整的数字）
		 * dotWidth: 标点的宽度，比如. ,
		 * unitWidth: 单位的宽度，比如 万 亿
		 *
		 */
		initDom: function (config) {
			this.itemHeight = config.height;
			this.itemWidth = config.width;
			this.showNum = config.showNum || 0;
			this.dotWidth = config.dotWidth || 4;
			this.unitWidth = config.unitWidth || 12;
			this.useRem = config.useRem || false;
			this.showNumArr = this.formatNumber(this.showNum);
			this.$animateDom = null;
		},

		/**
		 * 设置返回DOM结构
		 * 这里用来初始化this.numberDom字段
		 * 使用的时候需要将这个结构放到节点里边
		 */
		initScrollNum: function(){
			this.numberDom = this._setHtml(this.showNumArr);
		},

		/**
		 * 格式化数据
		 *
		 */
		formatNumber: function (showNumber) {
			var showNumArr = [];
			var showStr = showNumber.toString();
			for (var i = 0; i < showStr.length; i++) {
				var item = {};
				item.showNum = showStr[i];
				item.width = this.itemWidth;
				item.height = this.itemHeight;
				showNumArr.push(item);
			}
			return showNumArr;
		},

		/**
		 * 获取Dom节点
		 * @returns {string|*}
		 */
		getNumDom: function () {
			return this.numberDom;
		},

		/**
		 * 动画修改
		 * @param newCount string 需要进行动画的新数字，这里是个字符串
		 * @param isAdd boolean 是不是增长的，换句话说就是新数值是不是比原数值要大，这里需要传入，省去里边的复杂逻辑。
		 */
		animate: function (newCount, isAdd) {
			if(!this.$animateDom){
				return;
			}
			this.newShowNumArr = this.formatNumber(newCount);
			var anim1 = this.newShowNumArr.reverse();
			var anim2 = [];
			for (var i = this.$animateDom.length - 1; i >= 0; i--) {
				anim2.push(this.$animateDom.eq(i));
			}
			for (var j = 0; j < anim2.length; j++) {
				var config = {
					$numDom: anim2[j].find('dl'),
					num: anim1[j].showNum,
					height: this.itemHeight
				};
				this._setActiveNum(config, isAdd);
			}
		},

		/**
		 * 更新数据，将当前数字组件更新到新的值。
		 * 在不同位数的时候会用到这个，因为不同位数无法进行动画效果展示
		 */
		update: function (newCount) {
			this.newShowNumArr = this.formatNumber(newCount);
			this.numberDom = this._setHtml(this.newShowNumArr);
		},

		/**
		 * 获取模板
		 * 获取数字模板
		 * @private
		 */
		_setHtml: function (dataArr) {
			var _self = this;
			var tpl =
				'<small style="width:{smallWidth};height:{smallHeight};">' +
					'<dl style="top:-{currentTop}">' +
						'{numItems}' +
					'</dl>' +
				'</small>';
			var tplObj = new Tpl(tpl, function (item, order) {
				item.numItems = _self._getFormatedNumStr(item.showNum);
				item.smallWidth = _self.itemWidth + 'px';
				item.smallHeight = item.height + 'px';
				item.currentTop = _self.itemHeight * 9 + 'px';
				if (_self.useRem) {
					item.smallWidth = _self.itemWidth / 10 + 'rem';
					item.currentTop = _self.itemHeight * 9 / 10 + 'rem';
					item.smallHeight = item.height / 10 + 'rem';
				}
				if (item.showNum === '万' || item.showNum === '亿') {
					item.smallWidth = _self.unitWidth + 'px';
					if (_self.useRem) {
						item.smallWidth = _self.unitWidth / 10 + 'rem';
					}
					item.currentTop = 0;
				}

				if (item.showNum === '.' || item.showNum === ',') {
					item.smallWidth = _self.dotWidth + 'px';
					if (_self.useRem) {
						item.smallWidth = _self.dotWidth / 10 + 'rem';
					}
					item.currentTop = 0;
				}
			});
			return tplObj.render(dataArr);
		},

		/**
		 * 格式化
		 * @private
		 */
		_getFormatedNumStr: function (showNumItem) {
			if (showNumItem > 9 || showNumItem < 0) {
				return '';
			}
			var resultStr = '';
			if (isNaN(showNumItem)) {
				resultStr = '<dd>' + showNumItem + '</dd>';
			} else {
				var formatArr = this._getFormatArr(showNumItem);
				var upResult = '';
				var downResult = '';
				var middleResult = '<dd class="scrollItem' + showNumItem + '">' + showNumItem + '</dd>';
				for (var i = 0; i < formatArr.length; i++) {
					upResult +='<dd class="up scrollItem' + formatArr[i] + '">' + formatArr[i] + '</dd>';
					downResult +='<dd class="down scrollItem' + formatArr[i] + '">' + formatArr[i] + '</dd>';
				}
				resultStr = upResult + middleResult + downResult;
			}
			return resultStr;
		},

		/**
		 * 获取该值其他的数值数组列表
		 * 这里返回的数据应该为0-9的数组，只是不包含showNumber
		 * @private
		 */
		_getFormatArr: function (num) {
			num = parseInt(num, 10);
			var items1 = [];
			var items2 = [];
			for (var i = 0; i < num; i++) {
				items2.push(i);
			}
			for (var j = num + 1; j < 10; j++) {
				items1.push(j);
			}
			var items = items1.concat(items2);
			return items;
		},

		/**
		 * 设置当前值
		 * @param config
		 * @param isAdd 是否为数值增加，增加向上翻滚，否则向下翻滚
		 */
		_setActiveNum: function (config, isAdd) {
			var $numDom = config.$numDom;
			var num = config.num;
			var height = parseInt(config.height);
			var currentIndex = 0;
			var _self = this;

			if (isNaN(num)) {
				return;
			}
			if (isAdd) {
				currentIndex = $numDom.find('.down.scrollItem' + num).index();
			} else {
				currentIndex = $numDom.find('.up.scrollItem' + num).index();
			}
			var curTop = '-' + height * currentIndex + 'px';
			if (_self.useRem) {
				curTop = '-' + height * currentIndex / 10 + 'rem';
			}
			$numDom.animate({
				top: curTop
			}, 500, 'linear', function () {
				var formatedStr = _self._getFormatedNumStr(num);
				$numDom.html(formatedStr);
				if(_self.useRem){
					$numDom.css('top', -_self.itemHeight * 9 / 10 + 'rem');
				}else{
					$numDom.css('top', -_self.itemHeight * 9);
				}
			});
		}
	};
	module.exports = ScrollNum;
});
