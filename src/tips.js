/**
 * @file 提示的配置文件
 * @author xiaowu
 * @email fe.xiaowu@gmailc.com
 */

'use strict';

const TIPS = {};

/**
 * 请求method不正确
 *
 * @type {Object}
 */
TIPS.METHOD_ERROR = {
    errmsg: '请求类型不正确',
    errcode: 1001
};

/**
 * 请求的参数错误
 *
 * @type {Object}
 */
TIPS.PARAM_ERROR = {
    errmsg: '请求的参数错误',
    errcode: 1002
};

/**
 * 解析json失败
 *
 * @type {Object}
 */
TIPS.PARSE_JSON_ERROR = {
    errmsg: '解析json失败',
    errcode: 1003
};

/**
 * 解析js失败
 *
 * @type {Object}
 */
TIPS.PARSE_JS_ERROR = {
    errmsg: '解析js失败',
    errcode: 1004
};

/**
 * 文件/路径不存在
 *
 * @type {Object}
 */
TIPS.PATH_NOT_EXIST = {
    errmsg: '文件路径不存在',
    errcode: 1005
};

export default TIPS;
