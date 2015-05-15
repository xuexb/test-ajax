var express = require('express')
var app = express();
var open = require('open');
var path = require('path');
var md5 = require('MD5');
var template = require('art-template');
var admin = require('./admin');
var fs = require('fs');
var path = require('path');
var bodyParser = require('body-parser');
var PATH = 'cache/';
var URL = require('url');

//静态资源
app.use('/static', express.static(path.join(__dirname, 'static')));

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

// 配置模板
template.config('base', '');
template.config('extname', '.html');
app.engine('.html', template.__express);
app.set('view engine', 'html');



app.get('/_admin/api/create', admin.create);
app.post('/_admin/api/save', admin.save);

app.all('*', function(req, res, next){
    var uri, url = URL.parse(req.url), is_file, data;

    console.log(url);
    url = url.pathname;

    //如果为根目录
    if(!url || url === '/'){
        return res.send('/');
    }

    //生成key
    uri = path.resolve(PATH, md5(url) + '.json');

    is_file = fs.existsSync(uri);

    if(!is_file){
        return res.send('404,'+ url);
    }

    //值容错
    try{
        data = JSON.parse(fs.readFileSync(uri).toString())
    } catch(e){
        res.send('json error');
    }

    //类型不对
    if(data.method !== 'all' && req.method !== data.method){
        return res.send('method error');
    }

    //如果模板需要编译
    if(data['res-tpl']){
        data['res'] = template.compile(data['res'])({
            params: req.params || req.body
        });

        console.log(data['res']);
    }


    (function(callback){
        if(data.delay){
            setTimeout(callback, data.delay);
        } else {
            callback();
        }
    })(function(){
        if(data.dataType === 'json'){
            try{
                data['res'] = JSON.parse(data['res']);
            } catch(e){
                data['res'] = {'error': 1}
            }

            res.json(data['res']);
            res.end();
        } else {
            res.send(data['res']);
        }
    });
});

app.listen(3000);

// open('http://127.0.0.1:3000');
