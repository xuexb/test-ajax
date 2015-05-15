var express = require('express')
var app = express();
var open = require('open');
var path = require('path');


app.use('/static', express.static(path.join(__dirname, 'static')));

app.get('/', function (req, res) {
  res.send('Hello World')
});

app.get('/api.html', function(req, res){
    res.send('ok api');
});

app.all('*', function(req, res, next){
    res.send(req.url);
});


app.listen(3000);

open('http://127.0.0.1:3000');
