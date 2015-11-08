/**
 * @file 常用方法
 * @author xiaowu
 * @email fe.xiaowu@gmailc.com
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _tips = require('./tips');

var _tips2 = _interopRequireDefault(_tips);

var util = {};

/**
 * 解析字符串为json
 *
 * @param  {string}   str 字符串
 *
 * @return {Object}       json对象
 */
util.parseJSON = function () {
    var str = arguments.length <= 0 || arguments[0] === undefined ? '' : arguments[0];

    /* eslint-disable fecs-no-eval*/

    /* eslint-disable no-eval*/
    return eval('(' + str + ')');
    // return new Function('return ' + str)();
};

/**
 * 读取json文件，跟require不同的是，这个不会缓存
 *
 * @param {string} args 路径
 *
 * @return {Object}         解析后的json对象，错误时会有__error属性
 */
util.readJSON = function () {
    var filepath = _path2['default'].resolve.apply(_path2['default'], arguments);

    if (!_fs2['default'].existsSync(filepath)) {
        return _tips2['default'].PATH_NOT_EXIST;
    }

    var result = undefined;
    try {
        result = _fs2['default'].readFileSync(filepath).toString();
        result = JSON.parse(result);
    } catch (e) {
        result = _tips2['default'].PARSE_JSON_ERROR;
    }

    return result;
};

exports['default'] = util;
module.exports = exports['default'];