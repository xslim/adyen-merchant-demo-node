var crypto = require('crypto'),
    express = require('express');
var router = express.Router();

function hmacFromReq(req) {
  var key = req.query.key;
  var text = req.query.text;
  var hash = "";

  if (key == null) {
    key = process.env.hpp_hmacKey
  }

  if ((key != null) && (text != null)) {
    hash = hmacsha1(text, key);
  }
  return hash;
}

function hmacsha1(text, key) {
  var hash, hmac;
  hmac = crypto.createHmac('sha1', key);
  hmac.setEncoding('base64');
  hmac.write(text);
  hmac.end();
  hash = hmac.read();
  return hash;
}



router.all('/', function(req, res, next) {
  var hash = hmacFromReq(req)
  // hash = JSON.stringify({"hash": hash})
  res.end(hash)
});

module.exports.router = router;
