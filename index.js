/*
http://localhost:3000/articles/1
http://localhost:3000/articles/15
http://localhost:3000/article/?url=http://www.infoq.com/cn/news/2015/08/as2015-bj-start
*/

var express = require('express')
  , app = express()
  , cheerio = require('cheerio')
  , PageParser = require('pageparser.js')
  , request = require('request');

app.get('/article/', function (req, res) {
  var url = req.query.url;
  var options =  {
    'block':'#content',
    'url':url,
    'pattern':{
      title:'h1',
      html:/<div class="text_info">([\s\S]+?)<div/mi,
      author:'.author_general a',
      date:/发布于.*\s+(.*)/im
    }
  };
  var parser = new PageParser(options);

  var req_proxy = request(url);
  req_proxy.on('response', function (res_proxy) {
    var stream = this;
    if (res_proxy.statusCode != 200) return this.emit('error', new Error('Bad status code'));

    stream.pipe(parser)
    .on('error',function(err) {
      console.log(err)
    })
    .on('data',function(items) {
      var ret = {};
      var item = {};
      if(items.length>0)
      {
        item = items[0];
      }
      ret['data'] = item;
      res.json(ret);
    });
  });

});

app.get('/articles/:offset', function (req, res) {
  var offset = parseInt(req.params.offset);
  if(!offset){
    offset = 0;
  }

  var url = 'http://www.infoq.com/cn/development/news/';
  var options =  {
    'block':'.news_type_block',
    'url':url,
    'pattern':{
      title:'a',
      link:'a',
      description:'p',
      author:'.author a',
      date:/发布于.*\s+(.*)/im
    }
  };
  var parser = new PageParser(options);

  var req_proxy = request(url);
  req_proxy.on('response', function (res_proxy) {
    var stream = this;
    if (res_proxy.statusCode != 200) return this.emit('error', new Error('Bad status code'));

    stream.pipe(parser)
    .on('error',function(err) {
      console.log(err)
    })
    .on('data',function(items) {
      var ret = {};
      ret['count'] = items.length;
      ret['data'] = items; //.slice(offset, offset+5);
      res.json(ret);
    });
  });

});

var server = app.listen(3000, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});
