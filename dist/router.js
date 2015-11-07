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

var _template = require('./template');

var _template2 = _interopRequireDefault(_template);

var _packageJson = require('../package.json');

var _packageJson2 = _interopRequireDefault(_packageJson);

var app = undefined;
var router = _express2['default'].Router();

/**
 * 解析uri，传的uri里必须缓存过
 */
router.param('uri', function (req, res, next, id) {
    var config = app.config();
    var filepath = _path2['default'].resolve(config.cachePath, id + '.json');

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

    var filepath = _path2['default'].resolve(app.config('cachePath'), uri + '.json');

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
    var filepath = _path2['default'].resolve(config.cachePath, uri + '.json');

    // 如果没有文件
    if (!_fs2['default'].existsSync(filepath)) {
        return next();
    }

    try {
        data = JSON.parse(_fs2['default'].readFileSync(filepath).toString());
    } catch (e) {
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
    var filepath = _path2['default'].resolve(config.cachePath, uri + '.json');

    // 创建缓存目录
    _mkdirP2['default'].sync(_path2['default'].resolve(config.cachePath));

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
    var config = app.config();
    var result = undefined;

    var render = function render() {
        return res.render('admin/index', {
            list: result
        });
    };

    if (!_fs2['default'].existsSync(config.cachePath)) {
        console.log('cachePath目录不存在', config.cachePath);
        return render();
    }

    // 读取缓存目录里文件
    var data = _fs2['default'].readdirSync(config.cachePath);

    if (!data || !data.length) {
        console.log('cachePath目录下没有缓存文件');
        return render();
    }

    result = {};

    data.forEach(function (val, index) {
        data[index] = JSON.parse(_fs2['default'].readFileSync(_path2['default'].resolve(config.cachePath, val)).toString());

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
router.all('*', function (req, res, next) {
    var config = app.config();
    var url = _url2['default'].parse(req.url).pathname;

    // 生成key
    var uri = (0, _MD52['default'])(url);

    // 生成缓存文件路径
    var filepath = _path2['default'].resolve(config.cachePath, uri + '.json');

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
        var _ret = (function () {
            var param_err_arr = [];
            var param_data = undefined;

            if (data.method.toLowerCase() === 'get') {
                param_data = req.query;
            } else {
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
                    if (val.type === 'boolean' && param_data[val] !== 'true' && param_data[val] !== 'false') {
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
                return {
                    v: res.json({
                        errcode: 1006,
                        errmsg: param_err_arr
                    })
                };
            }
        })();

        if (typeof _ret === 'object') return _ret.v;
    }

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

    var callback = function callback() {
        if (data.dataType === 'json' || data.dataType === 'jsonp') {
            try {
                data.res = JSON.parse(data.res);
            } catch (e) {
                data.res = {
                    errcode: 107,
                    errmsg: 'res json error'
                };
            }

            res[data.dataType](data.res);
        } else if (data.dataType === 'js') {
            try {
                new Function('req', 'res', 'next', data.res)(req, res, next);
            } catch (e) {
                console.error(e);
                res.json({
                    error: 1
                });
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