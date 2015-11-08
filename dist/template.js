/**
 * @file 模板编译，使用art-template
 * @author xiaowu
 * @email fe.xiaowu@gmailc.com
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _artTemplateNodeTemplateNative = require('art-template/node/template-native');

var _artTemplateNodeTemplateNative2 = _interopRequireDefault(_artTemplateNodeTemplateNative);

_artTemplateNodeTemplateNative2['default'].config('base', '');
_artTemplateNodeTemplateNative2['default'].config('extname', '.html');
_artTemplateNodeTemplateNative2['default'].config('escape', false);

exports['default'] = _artTemplateNodeTemplateNative2['default'];
module.exports = exports['default'];