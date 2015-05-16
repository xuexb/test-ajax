var express = require('express')
var app = express();
var open = require('open');
var path = require('path');
var md5 = require('MD5');
var template = require('./arttemplate');
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
app.get('/_admin/api/list', admin.list);
app.get('/_admin/api/del/:uri', admin.del);
app.get('/_admin/api/edit/:uri', admin.edit);

app.all('*', function(req, res, next){
    var uri, url = URL.parse(req.url), is_file, data,
        param_err_arr, param_data;

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
        data = JSON.parse(fs.readFileSync(uri).toString());
    } catch(e){
        res.send('json error');
    }

    //类型不对
    if(req.method !== data.method){
        return res.send('method error');
    }

    //如果需要验证参数
    if(data.param_name){
        param_err_arr = [];

        if('string' === typeof data.param_name){
            data.param_name = [data.param_name];
        }

        if(data.method === 'GET'){
            param_data = req.query;
        } else {
            param_data = req.body;
        }

        data.param_name.forEach(function(val, index){

            //如果为必须，而参数里又没有
            if(data.param_required[index] && !param_data[val]){
                param_err_arr.push({
                    name: val,
                    type: 'required'
                });
                return;
            }

            //如果参数里有这个值 并且不是全部类型
            if(param_data[val] && data.param_type[index] !== '*'){
                if(data.param_type[index] === 'boolean' && 
                    (param_data[val] !== 'true' && param_data[val] !== 'false')
                ){
                    param_err_arr.push({
                        name: val,
                        type: 'type not boolean'
                    });
                    return;
                } else if(data.param_type[index] === 'int' && !/^\d+$/.test(param_data[val])){
                    param_err_arr.push({
                        name: val,
                        type: 'type not int'
                    });
                    return;
                }
            }
        });

        if(param_err_arr.length){
            return res.json({
                error: param_err_arr
            })
        }
    }

    //如果模板需要编译
    if(data['res-tpl']){
        data['res'] = template.compile(data['res'])({
            query: req.query,
            body: req.body
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
            res.send(data['res'] || 'empty');
        }

    });
});

app.listen(3000);

// open('http://127.0.0.1:3000');
