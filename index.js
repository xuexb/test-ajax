'use strict';

var express = require('express')
var open = require('open');
var path = require('path');
var md5 = require('MD5');
var template = require('art-template/node/template-native.js');
var admin = require('./admin');
var fs = require('fs');
var path = require('path');
var bodyParser = require('body-parser');
var URL = require('url');



module.exports = function(options) {
    var app = express();

    //默认参数
    var config = {
        prot: 90, //端口
        cache_path: "./__cache/", //缓存文件的路径，基于base
        global: {},
        static_path: ['/static/'],//静态域，基于url
        admin: '/admin/',//后台域，基于url
        doc: '/doc/',//文档域，基于url
        open: true,
    }

    //合并配置
    options = options || {};
    Object.keys(options).forEach(function(key) {
        config[key] = options[key];
    });

    //根
    config.base = path.resolve(__dirname);

    //得到缓存的绝对路径
    config.cache_path = path.resolve('./', config.cache_path);

    //写入到后台
    admin.config = config;

    //配置静态域
    config.static_path.forEach(function(val){
        app.use(val, express.static(path.resolve(config.base, val)));
    });

    //配置json
    app.use(bodyParser.urlencoded({
        extended: false
    }));
    app.use(bodyParser.json());

    // 配置模板
    template.config('base', '');
    template.config('extname', '.html');
    app.engine('.html', template.__express);
    app.set('views', path.resolve(__dirname, 'views'));
    app.set('view engine', 'html');


    //配置路径
    app.get(config.doc +':uri', admin.doc);
    app.get(config.admin +'create', admin.create);
    app.post(config.admin +'save', admin.save);
    app.get(config.admin, admin.list);
    app.get(config.admin +'del/:uri', admin.del);
    app.get(config.admin +'edit/:uri', admin.edit);

    //截获到其他的请求
    app.all('*', function(req, res, next) {
        var uri, url = URL.parse(req.url),
            is_file, data,
            param_err_arr, param_data;

        url = url.pathname;

        //如果为根目录
        if (!url || url === '/') {
            return res.send('/');
        }

        //生成key
        uri = path.resolve(config.cache_path, md5(url) + '.json');

        is_file = fs.existsSync(uri);

        if (!is_file) {
            return res.json({
                errcode: -1,
                errmsg: '404 error'
            });
        }

        //值容错
        try {
            data = JSON.parse(fs.readFileSync(uri).toString());
        } catch (e) {
            return res.json({
                errcode: -1,
                errmsg: 'json error'
            });
        }

        //类型不对
        if (req.method !== data.method) {
            return res.json({
                errcode: -1,
                errmsg: 'method error'
            });
        }

        //如果需要验证参数
        if (data.param_name) {
            param_err_arr = [];

            if (data.method === 'GET') {
                param_data = req.query;
            } else {
                param_data = req.body;
            }

            // 验证参数
            data.param_name.forEach(function(val, index) {

                //如果为必须，而参数里又没有
                if (data.param_required[index] && !param_data[val]) {
                    param_err_arr.push({
                        name: val,
                        type: 'required'
                    });
                    return;
                }

                //如果参数里有这个值 并且不是全部类型
                if (param_data[val] && data.param_type[index] !== '*') {
                    if (data.param_type[index] === 'boolean' &&
                        (param_data[val] !== 'true' && param_data[val] !== 'false')
                    ) {
                        param_err_arr.push({
                            name: val,
                            type: 'type not boolean'
                        });
                        return;
                    } else if (data.param_type[index] === 'int' && !/^\d+$/.test(param_data[val])) {
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
                    errcode: -1,
                    errmsg: param_err_arr
                })
            }
        }

        //如果模板需要编译
        if (data['res-tpl']) {
            console.log(data['res'])
            data['res'] = template.compile(data['res'])({
                get: req.query,
                post: req.body,
                global: config.global
            });
        }

        (function(callback) {
            if (data.delay) {
                setTimeout(callback, data.delay);
            } else {
                callback();
            }
        })(function() {
            if (data.dataType === 'json') {
                console.log(data['res'])
                try {
                    data['res'] = JSON.parse(data['res']);
                } catch (e) {
                    data['res'] = {
                        errcode: -1,
                        errmsg: 'tpl  compile json error'
                    }
                }
                res.send(data['res']);
            } else {
                res.send(data['res'] || 'empty');
            }
        });
    });

    app.listen(config.prot);

    if(config.open){
        open('http://127.0.0.1:'+ config.prot + config.admin);
    }
}