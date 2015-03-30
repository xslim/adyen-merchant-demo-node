var express = require('express'),
    Adyen  = require('../adyen'),
    passport = require('passport'),
    db = require('../db'),
    moment = require('moment');

//moment().format();

var last_pal_resp = ""

var router = express.Router();


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

  var adyen = new Adyen({
    host: credentials.endpoint,
    userpass: credentials.userpass,
    merchantAccount: credentials.merchant
  });

  adyen.authoriseApplePay(doc.merchantReference, doc.paymentData, doc.currencyCode, amount_minor_units, function(err, res){
    if (err) {
      return callback(true, null, res);
    }

    var resultCode = res['resultCode'];

    doc.sent = Date.now();
    doc.sentResponse = resultCode;
    doc.status = resultCode;
    doc.pgResponse = res;

    if (res['refusalReason']) {
      doc.sentResponse = res['refusalReason'];
    }
    if (res['pspReference']) {
      doc.pspReference = res['pspReference'];
    }

    doc.save();

    if (resultCode) {
      callback(null, resultCode, res);
    } else {
      callback(true, null, res);
    }

  });
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

        send_adyen(p, function (err, data, json){
          last_pal_resp = JSON.stringify(json, null, 2)
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

function currencyFormat(abbr) {
  if (abbr == 'USD') return '$';
  if (abbr == 'GBP') return '£';
  if (abbr == 'EUR') return '€';

}

router.get('/',
  passport.authenticate('basic', { session: false }),
  function(req, res){
  var env = process.env.api_env
  var dateFormat = 'MM.DD.YYYY';

  var limit = (req.query.limit) ? req.query.limit : 20;

  var query = Payment.find().limit(limit).sort('-date');
  query.select('-paymentData -token');
  query.lean().exec(function (err, ps) {
    if (err) {
      console.log(err)
      res.end(err)
      return
    }
    
    ps.forEach(function(item, i, a){
      item.date = moment(item.date).format(dateFormat);
      item.sent = moment(item.sent).format(dateFormat);
      item.currency = currencyFormat(item.currencyCode);
    });
    

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
  var dateFormat = 'MM.DD.YYYY';

  Payment.findById(id).lean().exec(function (err, doc) {
    if (err) {
      console.log(err)
      res.end(err)
      return
    }
    if (field != null) {
      doc = doc[field]
    }
      doc.date = moment(doc.date).format(dateFormat);
      doc.sent = moment(doc.sent).format(dateFormat);
      doc.currency = currencyFormat(doc.currencyCode);
    //res_json(res, doc)
    res.format({
      json: function(){
        res.json(doc)
      },
      html: function() {
        res.render('payment_item', {title: "Payment", p: doc, json: JSON.stringify(doc, null, 4)})
      }
    })
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

    send_adyen(doc, function (err, data, json){
      last_pal_resp = JSON.stringify(json, null, 2)
      if (err) {
        return res.end(String(body))
      }
      res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
      res.redirect('back')
    })

  })
});

module.exports.router = router;
