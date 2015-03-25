var url = require('url');
var Request = require('request');
var util = require('util')

function mergeOptions(defaults, options) {
  var keys = Object.keys(defaults)
  , i = keys.length
  , k ;

  options = options || {};

  while (i--) {
    k = keys[i];
    if (!(k in options)) {
      options[k] = defaults[k];
    }
  }

  return options;
};

function rawrequest(rurl, userpass, data, callback) {
  var curl = url.parse(rurl);
  var secure = curl.protocol === 'https:';
  var host = curl.hostname;
  var port = parseInt(curl.port, 10);
  var path = [curl.pathname || '/', curl.search || '', curl.hash || ''].join('');
  var method = data ? "POST" : "GET";
  var headers = {
    //text/html,application/xhtml+xml,application/xml,text/xml;q=0.9,*/*;q=0.8
    "Accept" : "application/json",
    'Content-Type': "application/json",
    "Accept-Encoding": "none",
    "Accept-Charset": "utf-8",
    'Authorization': "Basic " + new Buffer(userpass).toString("base64"),
    "Connection": "close",
    "Host": host + (isNaN(port) ? "" : ":" + port)
  };
  var attr;

  if (typeof data === 'string') {
    headers["Content-Length"] = Buffer.byteLength(data, 'utf8');
    headers["Content-Type"] = "application/x-www-form-urlencoded";
  } else {
    data = JSON.stringify(data);
  }


  var options = {
    uri: curl,
    method: method,
    headers: headers
  };

  var request = Request(options, function (error, res, body) {
    if (error) {
      callback(error);
    } else {
      if (typeof body === "string") {
      }
      request.on('error', callback);
      callback(null, res, body);
    }
  });
  request.end(data);

  return request;
}

function Adyen(options) {
  if (!(this instanceof Adyen))
    return new Adyen(options);

    this.options = mergeOptions({
      host: "https://pal-live.adyen.com",
      userpass: '',
      merchantAccount: ''
    }, options);
}


/*
https://pal-live.adyen.com/pal/servlet/Payment/V9
PALURL="${PALPROTOCOL}://${PALHOST}/${WEBAPP}${SERVICE}/$METHOD"
SERVICE="/servlet/Payment/V9"
WEBAPP="pal"
METHOD="authorise"
*/
Adyen.prototype.request = function(webapp, service, method, data, callback) {
  var url = this.options.host + '/' + webapp + '/servlet/' + service + '/V9/' + method;

  console.log("Requesting", url);
  console.log("Data", data);

  return rawrequest(url, this.options.userpass, data, function(err, response, body) {
    if (typeof body === "string") {

      try {
        body = JSON.parse(body)
      } catch (e) {
        console.log("Body parse err", body)
        body = {
          data: body
        }
      }
    }

    callback(err, body);
  });
}

Adyen.prototype.authoriseApplePay = function(reference, token, currency, value, callback) {
  var data = {
    additionalData: {
      'payment.token': token
    },
    amount: {
      currency: currency,
      value: value
    },
    merchantAccount: this.options.merchantAccount,
    reference: reference
  }
  this.request('pal', 'Payment', 'authorise', data, function(err, res){
    console.log("err", err);
    console.log("res", res);
    callback(err, res);
  })
}

module.exports = exports = Adyen;

if (require.main === module) {
    console.log("use require('adyen')");
}
