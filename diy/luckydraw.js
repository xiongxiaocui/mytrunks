/*
抽奖挂件
author:xiongxiaocui
time:20151228
*/
define(function(require, exports, module) {
  var Luckydraw = require('./diyModules/m_luckydraw'),
    LuckydrawObj = {
      init: function(config) {
        var domId = config.domId;
        return new Luckydraw().init(config);
      }
    };
  module.exports = LuckydrawObj;

});
