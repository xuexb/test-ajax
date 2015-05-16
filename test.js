'use strict';

var test_ajax = require('./index');

test_ajax({
    prot: 90, //端口
    cache_path: "./__cache/", //缓存文件的路径，基于base
    global: {
        test: '我是测试的'
    },
    static_path: ['/static/'], //静态域，基于url
    admin: '/admin/', //后台域，基于url
    doc: '/doc/', //文档域，基于url
    open: true,
});