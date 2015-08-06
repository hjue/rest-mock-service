var express = require('express');
var app = express();
var cheerio = require('cheerio');

app.get('/articles/:offset', function (req, res) {
  var offset = parseInt(req.params.offset);
  if(!offset){
    offset = 0;
  }

  getNewsItem('http://www.infoq.com/cn/feed?token=n4TCh3U2mvWsuE9K549dOzEGK5vRwvnz',function (items) {
    var ret = {};
    ret['count'] = items.length;
    ret['data'] = items.slice(offset, offset+5);
    res.json(ret);
  });
});

var server = app.listen(3000, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});


var getNewsItem = function (url,callback) {
  var items = [];
  var FeedParser = require('feedparser')
  , request = require('request');

  var req = request(url)
    , feedparser = new FeedParser();

  req.on('error', function (error) {
    // handle any request errors
  });
  req.on('response', function (res) {
    var stream = this;

    if (res.statusCode != 200) return this.emit('error', new Error('Bad status code'));

    stream.pipe(feedparser);
  });


  feedparser.on('error', function(error) {
    // always handle errors
  });
  feedparser.on('end', function(err){
    if(callback){
      callback(items)
    }

  });
  feedparser.on('readable', function() {

    var stream = this
      , meta = this.meta
      , item;


    while (item = stream.read()) {
      items.push(transToPost(item))
    }


  });

  function transToPost(post){
    $ = cheerio.load(post.description);
    var imageUrl = $('img').first().attr("src");
    var mPost = {
        title : post.title,
        link : post.link,
        description : post.description,
        image: imageUrl,
        pubDate : post.pubDate,
        author : post.author
    };
    return mPost;
    }

}

