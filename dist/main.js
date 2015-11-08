/**
 * @file 主文件
 * @author xiaowu
 * @email fe.xiaowu@gmailc.com
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _extend = require('extend');

var _extend2 = _interopRequireDefault(_extend);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _serveStatic = require('serve-static');

var _serveStatic2 = _interopRequireDefault(_serveStatic);

var _bodyParser = require('body-parser');

var _bodyParser2 = _interopRequireDefault(_bodyParser);

var _packageJson = require('../package.json');

var _packageJson2 = _interopRequireDefault(_packageJson);

var _config = require('./config');

var _config2 = _interopRequireDefault(_config);

var _router = require('./router');

var _router2 = _interopRequireDefault(_router);

var _update = require('./update');

var _update2 = _interopRequireDefault(_update);

var _template = require('./template');

var _template2 = _interopRequireDefault(_template);

var _util = require('./util');

var _util2 = _interopRequireDefault(_util);

var TestAjax = (function () {
    function TestAjax() {
        var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

        _classCallCheck(this, TestAjax);

        // 合并配置
        this.__config = (0, _extend2['default'])(true, _config2['default'], options);

        // 转换路径为绝对路径
        this._resolvePath();

        this._init();
    }

    /**
     * 初始化
     *
     * @private
     */

    _createClass(TestAjax, [{
        key: '_init',
        value: function _init() {
            var self = this;
            var app = self.express = (0, _express2['default'])();

            _router2['default'].setApp(self);
            _update2['default'].setApp(self);

            // 配置json
            app.use(_bodyParser2['default'].urlencoded({
                extended: false
            }));
            app.use(_bodyParser2['default'].json());

            // 配置模板
            app.engine('.html', _template2['default'].__express);
            app.set('views', _path2['default'].resolve(self.config('__dirname'), './views/'));
            app.set('view engine', 'html');

            // 添加响应头
            app.use(function (req, res, next) {
                res.append('By-' + _packageJson2['default'].name, _packageJson2['default'].version);
                next();
            });

            app.use(_router2['default']);
            app.use('/update/', _update2['default']);

            // 配置静态static代理到包目录里的static
            app.use('/static', (0, _serveStatic2['default'])(_path2['default'].resolve(self.config('__dirname'), './static/')));
        }

        /**
         * 运行
         *
         * @return {Object}   self
         */
    }, {
        key: 'run',
        value: function run() {
            var self = this;

            self.express.listen(self.config('port'));

            return self;
        }

        /**
         * 获取文档目录树
         *
         * @return {Array}   目录树数组
         */
    }, {
        key: 'getDocTree',
        value: function getDocTree() {
            var data = [];
            var listdata = this.getCacheFileList();

            Object.keys(listdata).forEach(function (key) {
                var temp = {};

                temp.text = key;
                temp.children = [];

                listdata[key].forEach(function (val) {
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
    }, {
        key: 'getCacheFileList',
        value: function getCacheFileList() {
            var self = this;
            var result = {};
            var config = this.config();

            if (!_fs2['default'].existsSync(config.cachePath)) {
                return result;
            }

            // 读取缓存目录里文件
            var data = _fs2['default'].readdirSync(config.cachePath);

            if (!data || !data.length) {
                return result;
            }

            data.forEach(function (val, index) {
                val = _util2['default'].readJSON(config.cachePath, val);

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
    }, {
        key: 'getUriToPath',
        value: function getUriToPath(uri) {
            return _path2['default'].resolve(this.config('cachePath'), uri + '.json');
        }

        /**
         * 转换配置的路径
         *
         * @private
         */
    }, {
        key: '_resolvePath',
        value: function _resolvePath() {
            var config = this.config();
            this.config('base', _path2['default'].resolve('./', config.base));
            this.config('cachePath', _path2['default'].resolve('./', config.cachePath));

            // 设置包的目录
            this.config('__dirname', _path2['default'].dirname(__dirname));
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
    }, {
        key: 'config',
        value: function config() {
            var key = arguments.length <= 0 || arguments[0] === undefined ? '' : arguments[0];
            var val = arguments.length <= 1 || arguments[1] === undefined ? '' : arguments[1];

            if (key === '') {
                return this.__config;
            } else if (val === '') {
                return this.__config[key];
            } else if (val === null) {
                delete this.__config[key];
            } else {
                this.__config[key] = val;
            }
            return this;
        }
    }]);

    return TestAjax;
})();

exports['default'] = TestAjax;
module.exports = exports['default'];