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

    uri = md5(url);


    url = path.resolve(PATH, md5(url) + '.json');

    mkdir(path.resolve(PATH));

    fs.writeFileSync(url, JSON.stringify(data));

    res.send('ok');
}

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


function chmod(p, mode) {
    mode = mode || '0777';

    if (!fs.existsSync(p)) {
        return true;
    }
    return fs.chmodSync(p, mode);
};