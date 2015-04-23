var url = require('url'),
  util = require('util'),
  crypto = require('crypto');

var Request = require('request');

var debug = false;

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

function rawrequest(rurl, data, options, callback) {
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
    "Connection": "close",
    "Host": host + (isNaN(port) ? "" : ":" + port)
  };

  if (options && options["username"] && options["token"]) {
    var userpass = options["username"] + ':';
    headers['Authorization'] = "Basic " + new Buffer(userpass).toString("base64");
    headers['jaasToken'] = options["token"];
  } else if (options && options["username"] && options["password"]) {
    var userpass = options["username"] + ':' + options["password"];
    headers['Authorization'] = "Basic " + new Buffer(userpass).toString("base64");
  } else if (options && options["userpass"]) {
    var userpass = options["userpass"];
    headers['Authorization'] = "Basic " + new Buffer(userpass).toString("base64");
  }

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

    if (debug) {
      console.log('Request: ', error, res, body);
    }

    if (res.statusCode == 401 && !error) {
      error = {
        statusCode: res.statusCode,
        statusMessage: res.statusMessage
      }
    }

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

  if (debug) {
    console.log("Requesting", url);

  }
  console.log("Requesting with Data", data);

  return rawrequest(url, data, this.options, function(err, response, body) {
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

Adyen.prototype.authoriseApplePay = function(reference, token, currency, value,  options, callback) {
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

  if (options && options.hasOwnProperty('captureDelayHours')) {
    data.captureDelayHours = options['captureDelayHours'];
  }

  this.request('pal', 'Payment', 'authorise', data, function(err, res){
    console.log("err", err);
    console.log("res", res);
    callback(err, res, data);
  })
}

Adyen.parseNotifications = function(data) {
  var notes = [];
  if (!data.notificationItems) {
    return notes;
  }

  data.notificationItems.forEach(function(item){
    if (item.NotificationRequestItem) {
      notes.push(item.NotificationRequestItem);
    }
  });
  return notes;
};

Adyen.endpoint = function(platform) {
  if (platform == 'test') {
    return "https://pal-test.adyen.com";
  }
  return "https://pal-live.adyen.com";
}

Adyen.hmac = function(text, key) {
  var hmac = crypto.createHmac('sha1', key);
  hmac.setEncoding('base64');
  hmac.write(text);
  hmac.end();
  return hmac.read();
}

Adyen.amount2minorUnits = function(amount) {
  var amount_minor_units = amount * 100;
  return String(amount_minor_units.toFixed(0))
}

Adyen.responses = {
  notification: {
    notificationResponse: "[accepted]"
  }
}


module.exports = exports = Adyen;

if (require.main === module) {
    console.log("use require('adyen')");
}
