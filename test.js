'use strict';

var test_ajax = require('./index');

test_ajax({
    base: './',//项目根目录
    prot: 90, //端口
    cache_path: "./__cache/", //缓存文件的路径，基于base
    global: {
        test: '我是测试的'
    },
    static_path: ['/static/'], //静态域，基于url
    admin: '/admin/', //后台域，基于url
    doc: '/doc/', //文档域，基于url
    open: true,//是否打开浏览器
    md: true,//md文档
    beforeSend: function(req, res){//请求前回调，返回false则不请求接口，这里不算静态资源，后台，文档
    }
});