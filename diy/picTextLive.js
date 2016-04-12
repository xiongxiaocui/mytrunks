/**
 * @fileoverview 2015 图文直播挂件
 * @authors liuxiaoyue3@letv.com
 * @date 20150910
 */
define(function(require,exports,module){
    var picTextLive = require('./diyModules/m_picTextLive');
    var ptlComp = {
        init :function(opt){
            if(opt.blockId){
                new picTextLive(opt);
            }
        }
    };
    module.exports = ptlComp;
});