/**
 * @file 主文件
 * @author xiaowu
 * @email fe.xiaowu@gmailc.com
 */

'use strict';

import extend from 'extend';
import path from 'path';
import express from 'express';
import serveStatic from 'serve-static';
import bodyParser from 'body-parser';

import pkg from '../package.json';
import config from './config';
import router from './router';
import template from './template';

export default class TestAjax {
    constructor(options = {}) {
        // 合并配置
        this.__config = extend(true, config, options);

        // 转换路径为绝对路径
        this.resolvePath();

        console.log(this.config());

        this.init();
    }

    init() {
        let self = this;
        let app = self.express = express();

        router.setApp(self);

        // 配置json
        app.use(bodyParser.urlencoded({
            extended: false
        }));
        app.use(bodyParser.json());

        // 配置模板
        app.engine('.html', template.__express);
        app.set('views', path.resolve(self.config('__dirname'), './views/'));
        app.set('view engine', 'html');

        // 添加响应头
        app.use((req, res, next) => {
            res.append('By-' + pkg.name, pkg.version);
            next();
        });

        app.use(router);

        // 配置静态static代理到包目录里的static
        app.use('/static', serveStatic(path.resolve(self.config('__dirname'), './static/')));
    }

    run() {
        let self = this;
        self.express.listen(self.config('port'), () => {
            console.log('server run is port at ' + self.config('port'));
        });
    }

    resolvePath() {
        let config = this.config();
        this.config('base', path.resolve('./', config.base));
        this.config('cachePath', path.resolve('./', config.cachePath));

        // 设置包的目录
        this.config('__dirname', path.dirname(__dirname));
    }

    config(key = '', val = '') {

        if (key === '') {
            return this.__config;
        }
        else if (val === '') {
            return this.__config[key];
        }
        else {
            if (val === null) {
                delete this.__config[key];
            }
            else {
                this.__config[key] = val;
            }

            return this;
        }
    }
}
