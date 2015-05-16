var md5 = require('MD5');
var fs = require('fs');
var path = require('path');

var PATH = 'cache/';

var admin = module.exports = {};


/**
 * 创建模板
 */
admin.create = function(req, res) {
    res.render('create');
}
    
/**
 * 列表
 */
admin.list = function(req, res){
    var data = fs.readdirSync(path.resolve(PATH));

    if(data && data.length > 0){
        data.forEach(function(that, index){
            data[index] = JSON.parse(fs.readFileSync(path.resolve(PATH, that)).toString());
            delete data[index]['res'];
        });
    }

    res.render('list', {data: data});
}

/**
 * 删除
 * @param {string} uri 链接uri
 */
admin.del = function(req, res){
    var uri = req.param('uri');

    if(!uri){
        return res.send('uri empty');
    }

    uri = path.resolve(PATH, uri + '.json');

    //不存在 
    if(!fs.existsSync(uri)){
        return res.send('404');
    }

    fs.unlinkSync(uri);
    res.send('成功');
}


/**
 * 编辑
 * @param {string} uri 链接uri
 */
admin.edit = function(req, res){
    var uri = req.param('uri');

    if(!uri){
        return res.send('uri empty');
    }

    res.send(uri)
}

/**
 * 保存
 */
admin.save = function(req, res){
    var data = req.body;
    var url = data.url;
    var uri;

    //根目录
    if(!url || url === '/'){
        return res.send('url error');
    }

    // 生成uri
    uri = md5(url);

    // 追加
    data.uri = uri;

    // 拼路径
    url = path.resolve(PATH, md5(url) + '.json');

    // 创建缓存目录
    mkdir(path.resolve(PATH));

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