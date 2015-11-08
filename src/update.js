/**
 * @file 升级
 * @author xiaowu
 * @email fe.xiaowu@gmailc.com
 */

'use strict';

import express from 'express';

let app;
let router = express.Router();

/**
 * 2.0.3升级3.0.0
 */
router.get('/2.0.3-3.0.0', (req, res, next) => {
});

router.setApp = (data) => {
    app = data;
};

export default router;
