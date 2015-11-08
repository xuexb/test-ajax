/**
 * @file 主文件
 * @author xiaowu
 * @email fe.xiaowu@gmailc.com
 */

'use strict';

import extend from 'extend';
import path from 'path';
import fs from 'fs';
import express from 'express';
import serveStatic from 'serve-static';
import bodyParser from 'body-parser';

import pkg from '../package.json';
import config from './config';
import router from './router';
import update from './update';
import template from './template';
import Util from './util';

export default class TestAjax {
    constructor(options = {}) {
        // 合并配置
        this.__config = extend(true, config, options);

        // 转换路径为绝对路径
        this._resolvePath();

        this._init();



    }

    /**
     * 初始化
     *
     * @private
     */
    _init() {
        let self = this;
        let config = self.config();
        let app = self.express = express();

        router.setApp(self);
        update.setApp(self);

        // 配置json
        app.use(bodyParser.urlencoded({
            extended: false
        }));
        app.use(bodyParser.json());

        // 配置模板
        app.engine('.html', template.__express);
        app.set('views', path.resolve(config.__dirname, './views/'));
        app.set('view engine', 'html');

        // 添加响应头
        app.use((req, res, next) => {
            res.append('By-' + pkg.name, pkg.version);
            next();
        });

        app.use(router);
        app.use('/update/', update);

        // 配置静态static代理到包目录里的static
        app.use('/static', serveStatic(path.resolve(config.__dirname, './static/')));

        Object.keys(config.global).forEach((key) => {
            config.global[key] = JSON.stringify(config.global[key]);
        });
    }

    /**
     * 运行
     *
     * @return {Object}   self
     */
    run() {
        let self = this;

        self.express.listen(self.config('port'));

        return self;
    }

    /**
     * 获取文档目录树
     *
     * @return {Array}   目录树数组
     */
    getDocTree() {
        let data = [];
        let listdata = this.getCacheFileList();

        Object.keys(listdata).forEach((key) => {
            let temp = {};

            temp.text = key;
            temp.children = [];

            listdata[key].forEach((val) => {
                temp.children.push({
                    text: val.desc,
                    uri: '/doc/' + val.uri
                });
            });

            data.push(temp);
        });

        return data;
    }

    /**
     * 获取缓存的文件列表
     *
     * @return {Object}   以{分组: [{}]}的对象形式返回
     */
    getCacheFileList() {
        let self = this;
        let result = {};
        let config = this.config();

        if (!fs.existsSync(config.cachePath)) {
            return result;
        }

        // 读取缓存目录里文件
        let data = fs.readdirSync(config.cachePath);

        if (!data || !data.length) {
            return result;
        }

        data.forEach((val, index) => {
            val = Util.readJSON(config.cachePath, val);

            // 如果有错误
            if (val.errcode) {
                return;
            }

            // 如果没有组
            if (!val.group) {
                val.group = self.config('defaultGroup');
            }

            if (!result[val.group]) {
                result[val.group] = [];
            }

            result[val.group].push(val);
        });

        return result;
    }

    /**
     * 使用uri获取完成路径
     *
     * @param  {string}   uri uri
     *
     * @return {string}       路径
     */
    getUriToPath(uri) {
        return path.resolve(this.config('cachePath'), uri + '.json');
    }

    /**
     * 转换配置的路径
     *
     * @private
     */
    _resolvePath() {
        let config = this.config();
        this.config('base', path.resolve('./', config.base));
        this.config('cachePath', path.resolve('./', config.cachePath));

        // 设置包的目录
        this.config('__dirname', path.dirname(__dirname));
    }

    /**
     * 配置
     *
     * @date   2015-11-08
     *
     * @param  {string|undefined}   key 配置的key
     * @param  {string|null}   val 配置的val
     *
     * @return {Object}       配置
     *
     * @example
     *     1. 获取全部配置: config()
     *     2. 获取配置key: config('key');
     *     3. 设置配置key: config('key', 'val');
     *     4. 删除配置key: config('key', null);
     */
    config(key = '', val = '') {
        if (key === '') {
            return this.__config;
        }
        else if (val === '') {
            return this.__config[key];
        }
        else if (val === null) {
            delete this.__config[key];
        }
        else {
            this.__config[key] = val;
        }
        return this;
    }
}
