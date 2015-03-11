var express = require('express'),
    http  = require('../http'),
    querystring = require('querystring'),
    passport = require('passport')

var last_pal_resp = ""

var router = express.Router();

var xmltoken = require('../xmltoken')

var db = require('../db');

var storage = db.storage
var Payment = db.Payment

function res_json(res, json) {
  res.format({
    json: function(){
      res.json(json)
    },
    html: function() {
      res.end("<pre>"+JSON.stringify(json, null, 2)+"</pre>")
    }
  })
}


function send_adyen(doc, callback) {

  var credentials = storage.getCredentials()

  var amount_minor_units = doc.amount * 100;
  amount_minor_units = String(amount_minor_units.toFixed(0))


  var args = {
    amount: amount_minor_units,
    currency: doc.currencyCode,
    reference: doc.merchantReference,
    merchant: credentials.merchant,
    token: doc.paymentData
  };

  var xml = xmltoken(args)

  var headers = {
    //SOAPAction: '"' + soapAction + '"',
    'Authorization': "Basic " + new Buffer(credentials.userpass).toString("base64"),
    'Content-Type': "text/xml; charset=utf-8"
  }

  console.log("\nSending to "+credentials.endpoint+" :\n ", xml)
  //return res.end(xml);

  http_req = http.request(credentials.endpoint, xml, function(err, response, body) {
    if (err) {
      console.log(err);
      res.end(String(err));
    } else {
      console.log("Responce from PAL ("+response.statusCode+"):\n ", body)

      var regex, match;

      regex = /<faultstring>(.+)<\/faultstring>/
      match = body.match(regex);

      if (match && match[1]) {
        doc.sent = Date.now();
        doc.sentResponse = match[1];
        doc.responseBody = body;
        doc.save();

        //return res.redirect('/payments')
        //return res.end(match[1])
        return callback(null, match[1], body);
      }

      regex = /<resultCode .+>(.+)<\/resultCode>/
      match = body.match(regex);

      if (match && match[1]) {
        doc.sent = Date.now();
        doc.sentResponse = match[1];
        doc.responseBody = body;

        if (match[1] == 'Authorised') {
          doc.status = 'Authorised';
        }

        doc.save();

        //return res.redirect('/payments')
        //return res.end(match[1])
        return callback(null, match[1], body);
      }

      //res.end(body);
      callback(true, null, body);

    }
  }, headers, {});
}

router.post('/', function(req, res){
  var payment = req.body

  if (payment) {
    console.log(payment.merchantReference)

    var p = new Payment(payment)
    p.save(function (err) {
      if (err) {
        console.log("Error saving token: "+err)
        res.end()
      } else {
        //

        send_adyen(p, function (err, data, body){
          last_pal_resp = body
          if (err) {
            return res.sendStatus(406)
          }

          if (data == 'Authorised') {
            return res.end(String(p.date)+"\n")
          }

          return res.sendStatus(406)

        })

      }

    });

    if (p.paymentData) {
      if (p.paymentData.charAt(0) == '{') {
        p.token = JSON.parse(p.paymentData);
      } else {
        var buf = new Buffer(p.paymentData, 'base64');
        p.token = JSON.parse(buf.toString());
      }
      p.save()
    }

  }
});

router.get('/',
  passport.authenticate('basic', { session: false }),
  function(req, res){
  var env = process.env.api_env

  var limit = (req.query.limit) ? req.query.limit : 10;

  var query = Payment.find().limit(limit).sort('-date');
  query.select('-paymentData -token');
  query.exec(function (err, ps) {
    if (err) {
      console.log(err)
      res.end(err)
      return
    }

    res.format({
      json: function(){
        res.json(json)
      },
      html: function() {
        res.render('payments', {
          title: "Payments",
          env: env,
          payments: ps,
          last_pal_resp: last_pal_resp})
      }
    })
  })
});


router.get('/purge/:yes?', function(req, res){
  var yes = req.params.yes

  var query = Payment.find().sort('-date');
  query.select('-paymentData -token');

  if (yes == 'yes') {
    query.remove({"merchantReference": null })
  } else {
    query.where({"merchantReference": null })
  }

  query.exec(function (err, ps) {
    if (err) {
      console.log(err)
      res.end(err)
      return
    }

    res_json(res, ps)
  })
});

router.get('/query/:q?', function(req, res){
  var q = req.params.q
  if (!q) q = req.query.q


  try {
    q = JSON.parse(q)
  } catch (e) {
    console.log("Query e: "+e)
    return res.redirect('/payments')
  }

  console.log("Query: "+q)

  var limit = 15
  var query = Payment.find(q).limit(limit).sort('-date');
  query.select('-paymentData -token');
  query.exec(function (err, ps) {
    if (err) {
      console.log(err)
      res.end(err)
      return
    }

    res.format({
      json: function(){
        res.json(json)
      },
      html: function() {

        if (q) q = JSON.stringify(q)

        res.render('payments', {title: "Payments", payments: ps, query: q})
      }
    })
  })
});

router.get('/:id', function(req, res){
  var id = req.params.id
  var field = req.params.field

  Payment.findById(id, function (err, doc) {
    if (err) {
      console.log(err)
      res.end(err)
      return
    }
    if (field != null) {
      doc = doc[field]
    }
    res_json(res, doc)
  })
});

router.get('/status/:merchant/:reference', function(req, res){
  var merchant = req.params.merchant
  var reference = req.params.reference

  var q = {
    merchantIdentifier: merchant,
    merchantReference: reference
  }

  console.log(q)

  var what = 'amount currencyCode countryCode status date sent sentResponse'

  Payment.findOne(q, what ,function (err, doc) {
    if (err) {
      console.log(err)
      res.end(err)
      return
    }
    if (!doc) return res.sendStatus(404)

    if (!doc.status) doc.status = doc.sentResponse;

    res_json(res, doc)
  })
});

router.get('/:id/delete', function(req, res){
  var id = req.params.id
  var field = req.params.field
  // console.log(req.params)

  Payment.findById(id).remove().exec();
  res.redirect('/payments')
});

router.get('/:id/send', function(req, res){
  var id = req.params.id

  Payment.findById(id, function (err, doc) {
    if (err) {
      console.log(err)
      res.end(err)
      return
    }

    send_adyen(doc, function (err, data, body){
      last_pal_resp = body
      if (err) {
        return res.end(String(body))
      }
      res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
      res.redirect('back')
    })

  })
});

module.exports.router = router;
