
var cheerio = require('cheerio')
  , request = require('request')
  , util = require('util')
  , TransformStream = require('stream').Transform
  , url = require('url');

function type(obj){
    return Object.prototype.toString.call(obj).slice(8, -1);
}
function isObject ( obj ) {
   return obj && (typeof obj  === "object");
}

util.inherits(PageParser, TransformStream);

function PageParser (options) {
  if (!(this instanceof PageParser)) return new FeedParser(options);
  TransformStream.call(this);
  this._readableState.objectMode = true;
  this._readableState.objectMode = true;
  this._readableState.highWaterMark = 16; // max. # of output nodes buffered

  this.buffer = new Buffer(0);
  this.bufferSize = 0;
  this.options = options || {};
}

PageParser.prototype.getValue = function(obj,key,value) {
  var dom;
  switch (type(value)){
    case 'String':
      dom = $(obj).find(value);
      break;
    case 'RegExp':
      var found = $(obj).html().match(value);

      if(found){
        return found[1].trim();
      }
      return '';
      break;
    case 'Undefined':
      dom = $(obj);
      break;
  }

  if(dom.length==0){
    return '';
  }else{
    if(key.search(/html/i)!=-1){
      var html = '';
      for (var i = 0; i < dom.length; i++) {
        html+=dom.html();
      }

    }else{
      dom = dom.get(0)
    }

  }
  var tagName = dom.tagName.toLowerCase();
  var ret = "";
  switch (tagName){
    case "a":
      if(key.search('link')!=-1){
        ret = $(dom).eq(0).attr('href');
        ret = url.resolve(this.options.url, ret);
      }else{
        ret = $(dom).eq(0).text().trim();
      }

      break;
    case 'img':
      ret = $(dom).eq(0).attr('src');
      break;
    default:
      ret = $(dom).eq(0).text().trim();
  }
  return ret;
}



PageParser.prototype.handleText = function (html){
  $ = cheerio.load(html,{decodeEntities: false});
  var parser = this;
  var ret=[];
  $(parser.options.block).each(function(i, elem) {
    var obj ={} ;
    // obj['val'] = parser.getValue(this);
    var pattern = parser.options.pattern;
    if(isObject(pattern)){
      for (var key in pattern) {
        var value = pattern[key];
        if(value){
          var item = $(this).find(value);
          obj[key] = parser.getValue(this,key,value);
        }
      }
    }
    ret.push(obj);
  })
  return ret;
};

// Naive Stream API
PageParser.prototype._transform = function (chunk, encoding, done) {

  this.buffer = Buffer.concat([this.buffer, chunk]);
  this.bufferSize += chunk.length;
  done();

};

PageParser.prototype._flush = function (done) {

  try {
    var ret = this.handleText(this.buffer);
    this.push(ret);
  } catch (e) {
    this.emit("error", "Invalid format received"+e);
    return ;
  }

  done();

}

exports = module.exports = PageParser;