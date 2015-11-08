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
import Mock from 'mockjs';
import marked from 'marked';

import template from './template';
import pkg from '../package.json';
import tips from './tips';
import Util from './util';

let app;
let router = express.Router();

let renderDocTree = ((data, uri, group) => {
    let filter = (val) => {

        if (val.children && val.children.length) {
            return val.text === group;
        }

        return val.uri.indexOf(uri) > -1;
    };

    let fn = function (res) {
        let html = '';

        res.forEach(function (val) {
            if (!val.children || !val.children.length) {
                if (filter(val)) {
                    html += '<li class="nav-tree-file nav-tree-current">';
                }
                else {
                    html += '<li class="nav-tree-file">';
                }

                html += '<div class="nav-tree-text">';
                html += `<a href="${val.uri}" class="nav-tree-file-a" data-uri="${val.uri}" title="${val.text}">`;
                html += val.text;
                html += '</a></div></li>';
            }
            else {
                if (filter(val)) {
                    html += '<li class="nav-tree-dir nav-tree-dir-open">';
                }
                else {
                    html += '<li class="nav-tree-dir">';
                }

                html += '<div class="nav-tree-text">';
                html += `<a href="#" class="nav-tree-dir-a" data-uri="${val.uri}" title="${val.text}">${val.text}</a>`;
                html += '</div>';

                html += fn(val.children);

                html += '</li>';
            }
        });

        return '<ul>' + html + '</ul>';
    };

    return fn(data);
});

/**
 * 解析uri，传的uri里必须缓存过
 */
router.param('uri', (req, res, next, id) => {
    let config = app.config();
    let filepath = app.getUriToPath(id);

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

    let filepath = app.getUriToPath(uri);

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
    let filepath = app.getUriToPath(uri);

    // 如果没有文件
    if (!fs.existsSync(filepath)) {
        return next();
    }

    try {
        data = JSON.parse(fs.readFileSync(filepath).toString());
    }
    catch (e) {
        res.json(tips.PARSE_JSON_ERROR);
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
    let filepath = app.getUriToPath(uri);

    // 创建缓存目录
    mkdirp.sync(config.cachePath);

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
    res.render('admin/index', {
        list: app.getCacheFileList()
    });
});

router.get('/doc/', (req, res, next) => {
    // 渲染
    res.render('doc', {
        html: marked('欢迎访问接口文档～'),
        title: '接口文档',
        config: app.config(),
        treeData: renderDocTree(app.getDocTree())
    });
});

/**
 * 文档
 */
router.get('/doc/:uri', (req, res, next) => {
    let uri = req.uri;

    if (!uri) {
        return next();
    }

    let filepath = app.getUriToPath(uri);

    // 不存在
    if (!fs.existsSync(filepath)) {
        return next();
    }

    let filedata = fs.readFileSync(filepath).toString();

    try {
        filedata = JSON.parse(filedata);
    }
    catch (e) {
        return res.json(tips.PARSE_JSON_ERROR);
    }

    // 根据resdata里的配置解析出res
    // 必须非js才有
    if (filedata.resdata && filedata.dataType !== 'js') {
        try {
            // 非标准解析。解析出来的如：
            // [{name: '', }, {}]
            filedata.resdata = Util.parseJSON(filedata.resdata);
            filedata.resdata.forEach(function (val) {

                // 往对外上附加个data，让模板里使用
                val.data = template.compile(filedata.res)({
                    global: app.config('global'),
                    get: val.get || {},
                    post: val.post || {},
                    setDelay: function () {},
                    setHeader: function () {},
                    setStatus: function () {}
                });

                // 如果是json,jsonp则解析mock
                if (filedata.dataType === 'json' || filedata.dataType === 'jsonp') {
                    val.data = Util.parseJSON(val.data);
                    val.data = Mock.mock(val.data) || {};
                    val.data = JSON.stringify(val.data, null, 4);
                }

            });
        }
        catch (e) {
            delete filedata.resdata;
        }
    }
    else {
        delete filedata.resdata;
    }

    // 使用markdown模板解析数据
    let docMarkdown = fs.readFileSync(path.resolve(app.config('__dirname'), './views/admin/doc.markdown')).toString();
    docMarkdown = template.compile(docMarkdown)({
        data: filedata
    });

    if (req.query.pjax) {
        return res.send(marked(docMarkdown));
    }

    // 渲染
    res.render('doc', {
        html: marked(docMarkdown),
        title: filedata.desc || '接口',
        config: app.config(),
        treeData: renderDocTree(app.getDocTree(), uri, filedata.group || app.config('defaultGroup'))
    });
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
    let filepath = app.getUriToPath(uri);

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
        return res.json(tips.PARSE_JSON_ERROR);
    }

    // 类型不对
    if (req.method.toLowerCase() !== data.method.toLowerCase()) {
        return res.json(tips.METHOD_ERROR);
    }

    // 如果需要验证参数
    if (data.param) {
        let paramErrorArr = [];
        let paramData;

        if (data.method.toLowerCase() === 'get') {
            paramData = req.query;
        }
        else {
            paramData = req.body;
        }

        // 验证参数
        data.param.forEach(function (val) {
            // 如果为必须，而参数里又没有
            if (val.required === '1' && !paramData[val.name]) {
                paramErrorArr.push({
                    name: val.name,
                    type: 'required'
                });
                return;
            }

            // 如果参数里有这个值 并且不是全部类型
            if (paramData[val.name] && val.type !== '*') {
                if (val.type === 'boolean') {
                    if (paramData[val.name] !== 'true' && paramData[val.name] !== 'false') {
                        paramErrorArr.push({
                            name: val,
                            type: 'type not boolean'
                        });
                        return;
                    }
                }
                else if (val.type === 'int' && !/^\d+$/.test(paramData[val.name])) {
                    paramErrorArr.push({
                        name: val,
                        type: 'type not int'
                    });
                    return;
                }
            }

        });

        if (paramErrorArr.length) {
            return res.json({
                errcode: tips.PARAM_ERROR.errcode,
                errmsg: paramErrorArr
            });
        }
    }

    if (data.dataType !== 'js') {
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
    }

    let callback = () => {
        if (data.dataType === 'json' || data.dataType === 'jsonp') {
            try {
                data.res = Util.parseJSON(data.res);
                data.res = Mock.mock(data.res) || {};
            }
            catch (e) {
                data.res = tips.PARSE_JSON_ERROR;
            }

            res[data.dataType](data.res);
        }
        else if (data.dataType === 'js') {
            try {
                new Function('req', 'res', 'next', data.res)(req, res, next);
            }
            catch (e) {
                res.json(tips.PARSE_JS_ERROR);
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
