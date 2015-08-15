'use strict';

var md5 = require('MD5');
var fs = require('fs');
var path = require('path');
var marked = require('marked');
var pkg = require('./package.json');
var template = require('art-template/node/template-native.js');

var renderMarkdown = function(data){
    var highlight = require('highlight.js');
    var renderer = new marked.Renderer();

    renderer.heading = function(text, level) {
        var escapedText = encodeURIComponent(text); //.replace(/[^\w]+/g, '');

        return '<h' + level + '><a name="anchor-' +
            escapedText +
            '" href="#anchor-' +
            escapedText +
            '"></a><a class="anchor" href="#anchor-'+escapedText+'"><span class="header-link">#</span>' +
            text + '</a></h' + level + '>';
    }
    // 渲染代码
    // renderer.code = function (data, lang) {
        // return highlight.highlightAuto(data).value;
    // };
    
    // md => html
    data = marked(data, {
        renderer: renderer
    });

    return data;
}

var controller = module.exports = {};

controller.config = null;
    
/**
 * 升级版本
 */
controller.updateVersion = function(req, res, next){
    var config = controller.config;
    var data;

    if (fs.existsSync(config.cache_path)) {
        data = fs.readdirSync(config.cache_path);
        data = data.map(function(val){
            return JSON.parse(fs.readFileSync(path.resolve(config.cache_path, val)).toString());
        }).filter(function(val){
            return !val.version || val.version < pkg.version;
        });
    }

    if(!data || data.length === 0){
        return res.end('没有可升级的文件');
    }

    mkdir(path.resolve(controller.config.cache_path));

    data.forEach(function(val){
        if(val.param_name){
            if('string' === typeof val.param_name){
                val.param_name = [val.param_name];
                val.param_type = [val.param_type];
                val.param_required = [val.param_required];
                val.param_desc = [val.param_desc];
            }

            val.param = [];
            val.param_name.forEach(function(val_name, index){
                if(!val_name){
                    return;
                }
                val.param.push({
                    name: val_name,
                    type: val.param_type[index],
                    desc: val.param_desc[index],
                    required: val.param_required[index]
                });
            });

            if(!val.param.length){
                delete val.param;
            }

            delete val.param_name;
            delete val.param_type;
            delete val.param_required;
            delete val.param_desc;
        }

        val.version = pkg.version;

        fs.writeFileSync(path.resolve(controller.config.cache_path, val.uri + '.json'), JSON.stringify(val));

        console.log('升级 => uri:'+ val.uri +', url:'+ val.url);
    });

    res.end('ok');
}

/**
 * md文档浏览
 */
controller.md = function(req, res, next){
    var uri = req.url;
    var data;

    uri = path.resolve(controller.config.base, '.'+ uri);

    //不存在 
    if (!fs.existsSync(uri)) {
        return next();
    }


    data = fs.readFileSync(uri).toString();

    if(!data){
        return next();
    }

    res.render('doc', {
        html: renderMarkdown(data),
        title: (data.match(/<h1[^>]+?>(.+?)<\/h1>/) || ['', '文档预览'])[1]
    });
}

/**
 * 创建模板
 */
controller.create = function(req, res) {
    res.render('create', {
        admin_url: controller.config.admin,
        doc_url: controller.config.doc,
    });
}

/**
 * 文档预览
 */
controller.doc = function(req, res, next) {
    var uri = req.param('uri');
    var data;
    var html;

    if (!uri) {
        return next();
    }

    uri = path.resolve(controller.config.cache_path, uri + '.json');

    //不存在 
    if (!fs.existsSync(uri)) {
        return next();
    }

    try {
        data = JSON.parse(fs.readFileSync(uri).toString());
    } catch (e) {
        return res.json({
            errcode: 103,
            errmsg: 'doc json error'
        });
    }


    if(data.resdata){
        try{
            data.resdata = JSON.parse(data.resdata);
            data.resdata.forEach(function(val){
                val.data = template.compile(data.res)({
                    global: controller.config.global,
                    get: val.get || {},
                    post: val.post || {},
                    setDelay: function(){},
                    setHeader: function(){},
                    setStatus: function(){}
                });
            });
        } catch(e){
            delete data.resdata;
        }
    }


    html = fs.readFileSync(path.resolve(controller.config.__dirname, 'views', 'doc.tpl')).toString();
    html = template.compile(html)({
        data: data
    });


    res.render('doc', {
        html: renderMarkdown(html),
        title: data.desc || '接口',
    });
}

/**
 * 列表
 */
controller.list = function(req, res) {
    var config = controller.config;
    var result;
    var data;

    if (fs.existsSync(config.cache_path)) {
        data = fs.readdirSync(config.cache_path);
        if (data && data.length > 0) {
            result = {};

            data.forEach(function(that, index) {
                data[index] = JSON.parse(fs.readFileSync(path.resolve(config.cache_path, that)).toString());
                delete data[index]['res'];

                //截取
                if (data[index].desc) {
                    data[index].desc = String(data[index].desc).substr(0, 20) + '...';
                }

                //如果没有组
                if(!data[index].group){
                    data[index].group = '默认';
                }

                if(!result[data[index].group]){
                    result[data[index].group] = [];
                }

                result[data[index].group].push(data[index]);
            });
        }
    }

    data = null;

    res.render('list', {
        data: result,
        admin_url: config.admin,
        doc_url: config.doc,
    });
}


/**
 * 删除
 * @param {string} uri 链接uri
 */
controller.del = function(req, res, next) {
    var uri = req.param('uri');

    if (!uri) {
        return next();
    }

    uri = path.resolve(controller.config.cache_path, uri + '.json');

    //不存在 
    if (!fs.existsSync(uri)) {
        return next();
    }

    fs.unlinkSync(uri);

    res.send('成功');
}


/**
 * 编辑
 * @param {string} uri 链接uri
 */
controller.edit = function(req, res, next) {
    var uri = req.param('uri');
    var data;

    if (!uri) {
        return next();
    }

    uri = path.resolve(controller.config.cache_path, uri + '.json');

    if (!fs.existsSync(uri)) {
        return next();
    }

    try {
        data = JSON.parse(fs.readFileSync(uri).toString());
    } catch (e) {
        res.json({
            errcode: 104,
            errmsg: 'edit json error'
        });
    }

    res.render('edit', {
        data: data,
        admin_url: controller.config.admin,
        doc_url: controller.config.doc,
    });
}


/**
 * 保存
 */
controller.save = function(req, res, next) {
    var data = req.body;
    var url = data.url;
    var uri;

    //根目录
    if (!url || url === '/') {
        return next();
    }

    // 生成uri
    uri = md5(url);

    // 追加
    data.uri = uri;

    data.version = pkg.version;

    // 如果有参数
    if(data.param_name){
        // 如果是传的一个
        if('string' === typeof data.param_name){
            data.param_name = [data.param_name];
            data.param_type = [data.param_type];
            data.param_required = [data.param_required];
            data.param_desc = [data.param_desc];
        }

        data.param = [];
        data.param_name.forEach(function(val, index){
            if(!val){
                return;
            }
            data.param.push({
                name: val,
                type: data.param_type[index],
                desc: data.param_desc[index],
                required: data.param_required[index]
            });
        });

        if(!data.param.length){
            delete data.param;
        }

        delete data.param_name;
        delete data.param_type;
        delete data.param_required;
        delete data.param_desc;
    }

    // 拼路径
    url = path.resolve(controller.config.cache_path, md5(url) + '.json');

    // 创建缓存目录
    mkdir(path.resolve(controller.config.cache_path));

    // 写文件
    fs.writeFileSync(url, JSON.stringify(data));

    res.send('ok');
}



/**
 * 创建目录
 */
function mkdir(p, mode) {
    var pp;

    mode = mode || '0777';

    if (fs.existsSync(p)) {
        chmod(p, mode);
        return true;
    }
    pp = path.dirname(p);
    if (fs.existsSync(pp)) {
        fs.mkdirSync(p, mode);
    } else {
        mkdir(pp, mode);
        mkdir(p, mode);
    }
    return true;
}


/**
 * 设置权限
 */
function chmod(p, mode) {
    mode = mode || '0777';

    if (!fs.existsSync(p)) {
        return true;
    }
    return fs.chmodSync(p, mode);
};