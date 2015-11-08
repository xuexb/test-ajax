/**
 * @file 模板编译，使用art-template
 * @author xiaowu
 * @email fe.xiaowu@gmailc.com
 */

'use strict';

import template from 'art-template/node/template-native';

template.config('base', '');
template.config('extname', '.html');
template.config('escape', false);


export default template;
