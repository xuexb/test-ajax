/**
 * @file 常用方法
 * @author xiaowu
 * @email fe.xiaowu@gmailc.com
 */

'use strict';

import fs from 'fs';
import path from 'path';

import Tips from './tips';


let util = {};

/**
 * 解析字符串为json
 *
 * @param  {string}   str 字符串
 *
 * @return {Object}       json对象
 */
util.parseJSON = (str = '') => {
    return new Function('return ' + str)();
};

/**
 * 读取json文件，跟require不同的是，这个不会缓存
 *
 * @param  {...string} args 路径
 *
 * @return {Object}         解析后的json对象，错误时会有__error属性
 */
util.readJSON = (...args) => {
    let filepath = path.resolve(path, ...args);

    if (!fs.existsSync(filepath)) {
        return Tips.PATH_NOT_EXIST;
    }

    let result;
    try{
        result = fs.readFileSync(filepath).toString();
        result = JSON.parse(result);
    } catch(e){
        result = Tips.PARSE_JSON_ERROR;
    }

    return result;
};

export default util;
