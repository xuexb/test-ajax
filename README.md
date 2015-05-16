# test-ajax

一个本地模拟接口

## install

```
npm install test-ajax
```

## demo

``` js
var test_ajax = require('test-ajax');

test_ajax({
    prot: 90, //端口
    cache_path: "./__cache/", //缓存文件的路径，基于base
    global: {},
    static_path: ['/static/'], //静态域，基于url
    admin: '/admin/', //后台域，基于url
    doc: '/doc/', //文档域，基于url
    open: true,
});
```

## options

### prot

`number`, 端口，默认`90`

### cache_path
`string`, 缓存目录，基于`base`（文件路径）

### global
`object`, 通用参数，在返回值里使用，如：
```
({
    global:{
        '500': 500,
        '404': '{"errcode": "404"}'
    }
})
```

返回值里使用（注：需要开启编译）：
```
<%=global['500']%>
<%=global['404']%>
```

### static_patch
`array`, 静态资源目录，比如模板，样式，以`url`开始

### admin
`string`, 后台路径，`url`开始

### doc
`string`, 文档路径，`url`开始

### open
`boolean`, 是否打开浏览器