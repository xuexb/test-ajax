'use strict';

var express = require('express')
var open = require('open');
var path = require('path');
var md5 = require('MD5');
var template = require('art-template/node/template-native.js');
var controller = require('./controller');
var fs = require('fs');
var path = require('path');
var bodyParser = require('body-parser');
var URL = require('url');
var pkg = require('./package.json');

var serveStatic = require('serve-static');
var serveIndex = require('serve-index');

module.exports = function(options) {
    var app = express();

    //默认参数
    var config = {
        base: './',//项目根目录
        prot: 90, //端口
        cache_path: "./__cache/", //缓存文件的路径，基于base
        global: {},
        admin: '/admin/', //后台域，基于url
        doc: '/doc/', //文档域，基于url
        open: true,
        beforeSend: function(req, res){
        }
    }

    //合并配置
    options = options || {};
    Object.keys(options).forEach(function(key) {
        config[key] = options[key];
    });

    //项目根目录
    config.base = path.resolve('./', config.base);

    //程序根目录
    config.__dirname = path.resolve(__dirname);

    //得到缓存的绝对路径
    config.cache_path = path.resolve('./', config.cache_path);

    //写入到后台
    controller.config = config;

    //配置json
    app.use(bodyParser.urlencoded({
        extended: false
    }));
    app.use(bodyParser.json());

    // 配置模板
    template.config('base', '');
    template.config('extname', '.html');
    // template.config('compress', true);
    app.engine('.html', template.__express);
    app.set('views', path.resolve(config.__dirname, 'views'));
    app.set('view engine', 'html');

    //配置路径
    app.get(config.doc + ':uri', controller.doc);
    app.get(config.admin + 'create', controller.create);
    app.post(config.admin + 'save', controller.save);
    app.get(config.admin, controller.list);
    app.get(config.admin + 'del/:uri', controller.del);
    app.get(config.admin + 'edit/:uri', controller.edit);
    app.get('*.md', controller.md);

    // 升级
    app.get('/update-'+ pkg.version, controller.updateVersion);


    //截获到其他的请求
    app.all('*', function(req, res, next) {
        var uri;
        var url = URL.parse(req.url);
        var data;
        var param_err_arr;
        var param_data;

        url = url.pathname;

        if(config.beforeSend(req, res) === false){
            return false;
        }

        //如果为根目录
        if (!url || url === '/') {
            return next();
        }

        //生成key
        uri = path.resolve(config.cache_path, md5(url) + '.json');

        if (!fs.existsSync(uri)) {
            return next();
        }

        res.append('By-test-ajax', pkg.version);

        //值容错
        try {
            data = JSON.parse(fs.readFileSync(uri).toString());
        } catch (e) {
            return res.json({
                errcode: 101,
                errmsg: 'api json error'
            });
        }

        //类型不对
        if (req.method !== data.method) {
            return res.json({
                errcode: 102,
                errmsg: 'method error'
            });
        }

        //如果需要验证参数
        if (data.param) {
            param_err_arr = [];

            if (data.method === 'GET') {
                param_data = req.query;
            } else {
                param_data = req.body;
            }

            // 验证参数
            data.param.forEach(function(val) {
                // 如果为必须，而参数里又没有
                if (val.required === '1' && !param_data[val]) {
                    param_err_arr.push({
                        name: val,
                        type: 'required'
                    });
                    return;
                }

                //如果参数里有这个值 并且不是全部类型
                if (param_data[val] && val.type !== '*') {
                    if (val.type === 'boolean' &&
                        (param_data[val] !== 'true' && param_data[val] !== 'false')
                    ) {
                        param_err_arr.push({
                            name: val,
                            type: 'type not boolean'
                        });
                        return;
                    } else if (val.type === 'int' && !/^\d+$/.test(param_data[val])) {
                        param_err_arr.push({
                            name: val,
                            type: 'type not int'
                        });
                        return;
                    }
                }
            });

            if (param_err_arr.length) {
                return res.json({
                    errcode: 1006,
                    errmsg: param_err_arr
                })
            }
        }

        //如果模板需要编译
        if (data['res-tpl'] === '1') {
            data['res'] = template.compile(data['res'])({
                get: req.query,
                post: req.body,
                global: config.global,
                setHeader: function(name, val){
                    res.append(name, val);
                },
                setStatus: function(code){
                    res.status(code);
                },
                setDelay: function(time){
                    data.delay = time;
                },
                setCallback: function(name){
                    app.set('jsonp callback name', name);
                }
            });
        }

        (function(callback) {
            if (data.delay) {
                setTimeout(callback, data.delay);
            } else {
                callback();
            }
        })(function() {
            if (data.dataType === 'json' || data.dataType === 'jsonp') {
                try {
                    data['res'] = JSON.parse(data['res']);
                } catch (e) {
                    data['res'] = {
                        errcode: 107,
                        errmsg: 'res json error'
                    }
                }

                res[data.dataType](data.res);
            } else {
                if(data['res']){
                    res.send(data['res']);
                } else {
                    next();
                }
            }
        });
    });

    app.use('/', serveIndex(config.base, {'icons': true}));
    app.use(serveStatic(config.base, {'index': ['default.html', 'default.htm']}));


    app.listen(config.prot);

    if (config.open) {
        open('http://127.0.0.1:' + config.prot + config.admin);
    }
}