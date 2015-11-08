/**
 * @file 路径
 * @author xiaowu
 * @email fe.xiaowu@gmailc.com
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _MD5 = require('MD5');

var _MD52 = _interopRequireDefault(_MD5);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _mkdirP = require('mkdir-p');

var _mkdirP2 = _interopRequireDefault(_mkdirP);

var _url = require('url');

var _url2 = _interopRequireDefault(_url);

var _mockjs = require('mockjs');

var _mockjs2 = _interopRequireDefault(_mockjs);

var _marked = require('marked');

var _marked2 = _interopRequireDefault(_marked);

var _template = require('./template');

var _template2 = _interopRequireDefault(_template);

var _packageJson = require('../package.json');

var _packageJson2 = _interopRequireDefault(_packageJson);

var _tips = require('./tips');

var _tips2 = _interopRequireDefault(_tips);

var _util = require('./util');

var _util2 = _interopRequireDefault(_util);

var app = undefined;
var router = _express2['default'].Router();

var renderDocTree = function renderDocTree(data, uri, group) {
    var filter = function filter(val) {

        if (val.children && val.children.length) {
            return val.text === group;
        }

        return val.uri.indexOf(uri) > -1;
    };

    var fn = function fn(res) {
        var html = '';

        res.forEach(function (val) {
            if (!val.children || !val.children.length) {
                if (filter(val)) {
                    html += '<li class="nav-tree-file nav-tree-current">';
                } else {
                    html += '<li class="nav-tree-file">';
                }

                html += '<div class="nav-tree-text">';
                html += '<a href="' + val.uri + '" class="nav-tree-file-a" data-uri="' + val.uri + '" title="' + val.text + '">';
                html += val.text;
                html += '</a></div></li>';
            } else {
                if (filter(val)) {
                    html += '<li class="nav-tree-dir nav-tree-dir-open">';
                } else {
                    html += '<li class="nav-tree-dir">';
                }

                html += '<div class="nav-tree-text">';
                html += '<a href="#" class="nav-tree-dir-a" data-uri="' + val.uri + '" title="' + val.text + '">' + val.text + '</a>';
                html += '</div>';

                html += fn(val.children);

                html += '</li>';
            }
        });

        return '<ul>' + html + '</ul>';
    };

    return fn(data);
};

/**
 * 解析uri，传的uri里必须缓存过
 */
router.param('uri', function (req, res, next, id) {
    var config = app.config();
    var filepath = app.getUriToPath(id);

    if (!_fs2['default'].existsSync(filepath)) {
        return next();
    }

    req.uri = id;
    next();
});

/**
 * 主页
 */
router.get('/', function (req, res, next) {
    return res.render('index');
});

/**
 * 删除接口
 */
router.get('/admin/del/:uri', function (req, res, next) {
    var uri = req.uri;

    if (!uri) {
        return next();
    }

    var filepath = app.getUriToPath(uri);

    // 不存在
    if (!_fs2['default'].existsSync(filepath)) {
        return next();
    }

    _fs2['default'].unlinkSync(filepath);

    res.send('成功');
});

/**
 * 编辑接口
 */
router.get('/admin/edit/:uri', function (req, res, next) {
    var uri = req.uri;

    if (!uri) {
        return next();
    }

    var data = undefined;
    var config = app.config();
    var filepath = app.getUriToPath(uri);

    // 如果没有文件
    if (!_fs2['default'].existsSync(filepath)) {
        return next();
    }

    try {
        data = JSON.parse(_fs2['default'].readFileSync(filepath).toString());
    } catch (e) {
        res.json(_tips2['default'].PARSE_JSON_ERROR);
    }

    res.render('admin/edit', {
        data: data
    });
});

/**
 * 保存
 */
router.post('/admin/save', function (req, res, next) {
    var config = app.config();
    var data = req.body;

    // 生成uri
    var uri = (0, _MD52['default'])(data.url);

    // 追加
    data.uri = uri;

    data.version = _packageJson2['default'].version;

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
        data.param_name.forEach(function (val, index) {
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
    var filepath = app.getUriToPath(uri);

    // 创建缓存目录
    _mkdirP2['default'].sync(config.cachePath);

    // 写文件
    _fs2['default'].writeFileSync(filepath, JSON.stringify(data));

    res.send('ok');
});

/**
 * 创建接口
 */
router.get('/admin/create', function (req, res, next) {
    return res.render('admin/create');
});

/**
 * 后台主页
 */
router.get('/admin/', function (req, res, next) {
    res.render('admin/index', {
        list: app.getCacheFileList()
    });
});

router.get('/doc/', function (req, res, next) {
    // 渲染
    res.render('doc', {
        html: (0, _marked2['default'])('欢迎访问接口文档～'),
        title: '接口文档',
        config: app.config(),
        treeData: renderDocTree(app.getDocTree())
    });
});

/**
 * 文档
 */
router.get('/doc/:uri', function (req, res, next) {
    var uri = req.uri;

    if (!uri) {
        return next();
    }

    var filepath = app.getUriToPath(uri);

    // 不存在
    if (!_fs2['default'].existsSync(filepath)) {
        return next();
    }

    var filedata = _fs2['default'].readFileSync(filepath).toString();

    try {
        filedata = JSON.parse(filedata);
    } catch (e) {
        return res.json(_tips2['default'].PARSE_JSON_ERROR);
    }

    // 根据resdata里的配置解析出res
    // 必须非js才有
    if (filedata.resdata && filedata.dataType !== 'js') {
        try {
            // 非标准解析。解析出来的如：
            // [{name: '', }, {}]
            filedata.resdata = _util2['default'].parseJSON(filedata.resdata);
            filedata.resdata.forEach(function (val) {

                // 往对外上附加个data，让模板里使用
                val.data = _template2['default'].compile(filedata.res)({
                    global: app.config('global'),
                    get: val.get || {},
                    post: val.post || {},
                    setDelay: function setDelay() {},
                    setHeader: function setHeader() {},
                    setStatus: function setStatus() {}
                });

                // 如果是json,jsonp则解析mock
                if (filedata.dataType === 'json' || filedata.dataType === 'jsonp') {
                    val.data = _util2['default'].parseJSON(val.data);
                    val.data = _mockjs2['default'].mock(val.data);
                    val.data = JSON.stringify(val.data, null, 4);
                }
            });
        } catch (e) {
            delete filedata.resdata;
        }
    } else {
        delete filedata.resdata;
    }

    // 使用markdown模板解析数据
    var docMarkdown = _fs2['default'].readFileSync(_path2['default'].resolve(app.config('__dirname'), './views/admin/doc.markdown')).toString();
    docMarkdown = _template2['default'].compile(docMarkdown)({
        data: filedata
    });

    if (req.query.pjax) {
        return res.send((0, _marked2['default'])(docMarkdown));
    }

    // 渲染
    res.render('doc', {
        html: (0, _marked2['default'])(docMarkdown),
        title: filedata.desc || '接口',
        config: app.config(),
        treeData: renderDocTree(app.getDocTree(), uri, filedata.group || app.config('defaultGroup'))
    });
});

/**
 * 拦截所有请求
 */
router.all('*', function (req, res, next) {
    var config = app.config();
    var url = _url2['default'].parse(req.url).pathname;

    // 生成key
    var uri = (0, _MD52['default'])(url);

    // 生成缓存文件路径
    var filepath = app.getUriToPath(uri);

    // 缓存文件不存在
    if (!_fs2['default'].existsSync(filepath)) {
        return next();
    }

    // 如果有域设置
    if (config.domain) {
        res.append('Access-Control-Allow-Origin', config.domain);
    }

    var data = undefined;

    // 值容错
    try {
        data = JSON.parse(_fs2['default'].readFileSync(filepath).toString());
    } catch (e) {
        return res.json(_tips2['default'].PARSE_JSON_ERROR);
    }

    // 类型不对
    if (req.method.toLowerCase() !== data.method.toLowerCase()) {
        return res.json(_tips2['default'].METHOD_ERROR);
    }

    // 如果需要验证参数
    if (data.param) {
        var _ret = (function () {
            var paramErrorArr = [];
            var paramData = undefined;

            if (data.method.toLowerCase() === 'get') {
                paramData = req.query;
            } else {
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
                    } else if (val.type === 'int' && !/^\d+$/.test(paramData[val.name])) {
                        paramErrorArr.push({
                            name: val,
                            type: 'type not int'
                        });
                        return;
                    }
                }
            });

            if (paramErrorArr.length) {
                return {
                    v: res.json({
                        errcode: _tips2['default'].PARAM_ERROR.errcode,
                        errmsg: paramErrorArr
                    })
                };
            }
        })();

        if (typeof _ret === 'object') return _ret.v;
    }

    if (data.dataType !== 'js') {
        data.res = _template2['default'].compile(data.res)({
            get: req.query,
            post: req.body,
            global: config.global,
            setHeader: function setHeader(name, val) {
                res.append(name, val);
            },
            setStatus: function setStatus(code) {
                res.status(code);
            },
            setDelay: function setDelay(time) {
                data.delay = time;
            },
            setCallback: function setCallback(name) {
                app.express.set('jsonp callback name', name);
            }
        });
    }

    var callback = function callback() {
        if (data.dataType === 'json' || data.dataType === 'jsonp') {
            try {
                data.res = _util2['default'].parseJSON(data.res);
                data.res = _mockjs2['default'].mock(data.res);
            } catch (e) {
                data.res = _tips2['default'].PARSE_JSON_ERROR;
            }

            res[data.dataType](data.res);
        } else if (data.dataType === 'js') {
            try {
                new Function('req', 'res', 'next', data.res)(req, res, next);
            } catch (e) {
                res.json(_tips2['default'].PARSE_JS_ERROR);
            }
        } else {
            if (data.res) {
                res.send(data.res);
            } else {
                next();
            }
        }
    };

    if (data.delay) {
        setTimeout(callback, data.delay);
    } else {
        callback();
    }
});

router.setApp = function (data) {
    app = data;
};

exports['default'] = router;
module.exports = exports['default'];