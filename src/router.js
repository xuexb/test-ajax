/**
 * @file 路径
 * @author xiaowu
 * @email fe.xiaowu@gmailc.com
 */

'use strict';

import express from 'express';
import fs from 'fs';
import md5 from 'MD5';
import path from 'path';
import mkdirp from 'mkdir-p';
import URL from 'url';

import template from './template';
import pkg from '../package.json';

let app;
let router = express.Router();

/**
 * 解析uri，传的uri里必须缓存过
 */
router.param('uri', (req, res, next, id) => {
    let config = app.config();
    let filepath = path.resolve(config.cachePath, id + '.json');

    if (!fs.existsSync(filepath)) {
        return next();
    }

    req.uri = id;
    next();
});

/**
 * 主页
 */
router.get('/', (req, res, next) => res.render('index'));

/**
 * 删除接口
 */
router.get('/admin/del/:uri', (req, res, next) => {
    let uri = req.uri;

    if (!uri) {
        return next();
    }

    let filepath = path.resolve(app.config('cachePath'), uri + '.json');

    // 不存在 
    if (!fs.existsSync(filepath)) {
        return next();
    }

    fs.unlinkSync(filepath);

    res.send('成功');
});

/**
 * 编辑接口
 */
router.get('/admin/edit/:uri', (req, res, next) => {
    let uri = req.uri;

    if (!uri) {
        return next();
    }

    let data;
    let config = app.config();
    let filepath = path.resolve(config.cachePath, uri + '.json');

    // 如果没有文件
    if (!fs.existsSync(filepath)) {
        return next();
    }

    try {
        data = JSON.parse(fs.readFileSync(filepath).toString());
    }
    catch (e) {
        res.json({
            errcode: 104,
            errmsg: 'edit json error'
        });
    }

    res.render('admin/edit', {
        data: data
    });
});

/**
 * 保存
 */
router.post('/admin/save', (req, res, next) => {
    let config = app.config();
    let data = req.body;

    // 生成uri
    let uri = md5(data.url);

    // 追加
    data.uri = uri;

    data.version = pkg.version;

    // 如果有参数
    if (data.param_name) {
        // 如果是传的一个
        if ('string' === typeof data.param_name) {
            data.param_name = [data.param_name];
            data.param_type = [data.param_type];
            data.param_required = [data.param_required];
            data.param_desc = [data.param_desc];
        }

        data.param = [];
        data.param_name.forEach((val, index) => {
            if (!val) {
                return;
            }

            data.param.push({
                name: val,
                type: data.param_type[index],
                desc: data.param_desc[index],
                required: data.param_required[index]
            });
        });

        if (!data.param.length) {
            delete data.param;
        }
    }

    // 删除没用参数
    delete data.param_name;
    delete data.param_type;
    delete data.param_required;
    delete data.param_desc;

    // 拼路径
    let filepath = path.resolve(config.cachePath, uri + '.json');

    // 创建缓存目录
    mkdirp.sync(path.resolve(config.cachePath));

    // 写文件
    fs.writeFileSync(filepath, JSON.stringify(data));

    res.send('ok');
});

/**
 * 创建接口
 */
router.get('/admin/create', (req, res, next) => res.render('admin/create'));

/**
 * 后台主页
 */
router.get('/admin/', (req, res, next) => {
    let config = app.config();
    let result;

    let render = () => res.render('admin/index', {
            list: result
        });

    if (!fs.existsSync(config.cachePath)) {
        console.log('cachePath目录不存在', config.cachePath);
        return render();
    }

    // 读取缓存目录里文件
    let data = fs.readdirSync(config.cachePath);

    if (!data || !data.length) {
        console.log('cachePath目录下没有缓存文件');
        return render();
    }

    result = {};

    data.forEach((val, index) => {
        data[index] = JSON.parse(fs.readFileSync(path.resolve(config.cachePath, val)).toString());

        // 如果没有组
        if (!data[index].group) {
            data[index].group = '默认';
        }

        if (!result[data[index].group]) {
            result[data[index].group] = [];
        }

        result[data[index].group].push(data[index]);
    });

    render();
});

/**
 * 拦截所有请求
 */
router.all('*', (req, res, next) => {
    let config = app.config();
    let url = URL.parse(req.url).pathname;

    // 生成key
    let uri = md5(url);

    // 生成缓存文件路径
    let filepath = path.resolve(config.cachePath, uri + '.json');

    // 缓存文件不存在
    if (!fs.existsSync(filepath)) {
        return next();
    }

    // 如果有域设置
    if (config.domain) {
        res.append('Access-Control-Allow-Origin', config.domain);
    }

    let data;

    // 值容错
    try {
        data = JSON.parse(fs.readFileSync(filepath).toString());
    }
    catch (e) {
        return res.json({
            errcode: 101,
            errmsg: 'api json error'
        });
    }

    // 类型不对
    if (req.method.toLowerCase() !== data.method.toLowerCase()) {
        return res.json({
            errcode: 102,
            errmsg: 'method error'
        });
    }

    // 如果需要验证参数
    if (data.param) {
        let param_err_arr = [];
        let param_data;

        if (data.method.toLowerCase() === 'get') {
            param_data = req.query;
        }
        else {
            param_data = req.body;
        }

        // 验证参数
        data.param.forEach(function (val) {
            // 如果为必须，而参数里又没有
            if (val.required === '1' && !param_data[val]) {
                param_err_arr.push({
                    name: val,
                    type: 'required'
                });
                return;
            }

            // 如果参数里有这个值 并且不是全部类型
            if (param_data[val] && val.type !== '*') {
                if (val.type === 'boolean' &&
                    (param_data[val] !== 'true' && param_data[val] !== 'false')
                ) {
                    param_err_arr.push({
                        name: val,
                        type: 'type not boolean'
                    });
                    return;
                }
                else if (val.type === 'int' && !/^\d+$/.test(param_data[val])) {
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
            });
        }
    }

    data.res = template.compile(data.res)({
        get: req.query,
        post: req.body,
        global: config.global,
        setHeader: function (name, val) {
            res.append(name, val);
        },
        setStatus: function (code) {
            res.status(code);
        },
        setDelay: function (time) {
            data.delay = time;
        },
        setCallback: function (name) {
            app.express.set('jsonp callback name', name);
        }
    });

    let callback = () => {
        if (data.dataType === 'json' || data.dataType === 'jsonp') {
            try {
                data.res = JSON.parse(data.res);
            }
            catch (e) {
                data.res = {
                    errcode: 107,
                    errmsg: 'res json error'
                };
            }

            res[data.dataType](data.res);
        }
        else if (data.dataType === 'js') {
            try {
                new Function('req', 'res', 'next', data.res)(req, res, next);
            }
            catch (e) {
                console.error(e);
                res.json({
                    error: 1
                });
            }
        }
        else {
            if (data.res) {
                res.send(data.res);
            }
            else {
                next();
            }
        }
    };

    if (data.delay) {
        setTimeout(callback, data.delay);
    }
    else {
        callback();
    }
});

router.setApp = (data) => {
    app = data;
};

export default router;
