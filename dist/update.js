/**
 * @file 升级
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

var app = undefined;
var router = _express2['default'].Router();

/**
 * 2.0.3升级3.0.0
 */
router.get('/2.0.3-3.0.0', function (req, res, next) {});

router.setApp = function (data) {
  app = data;
};

exports['default'] = router;
module.exports = exports['default'];