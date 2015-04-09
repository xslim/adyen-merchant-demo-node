var express = require('express'),
  router = express.Router()
  adyen_helper  = require('../adyen_helper');

var mongoose = require('mongoose');
var Payment = mongoose.model('Payment');
var PaymentOperation = mongoose.model('PaymentOperation');

function currencyFormat(abbr) {
  if (abbr == 'USD') return '$';
  if (abbr == 'GBP') return '£';
  if (abbr == 'EUR') return '€';
}

router.get('/', function(req, res){
  var limit = (req.query.limit) ? req.query.limit : 40;

  var query = Payment.find({merchant: req.user}).limit(limit).sort('-date');
  query.select('-paymentData -token -pgResponse');
  query.lean().exec(function (err, ps) {
    if (err) {
      console.log(err)
      res.end(err)
      return
    }

    ps.forEach(function(item, i, a){
      item.currency = currencyFormat(item.currencyCode);
    });

    res.render('payments', { title: "Payments", payments: ps});
  })
});

router.get('/new', function(req, res){
  res.render('payment_new')
});

router.post('/', function(req, res){
  var payment = req.body

  if (!payment) {
    res.end()
  };

  var p = new Payment(payment)
  p.merchant = req.user;

  if (p.paymentData) {
    if (p.paymentData.charAt(0) == '{') {
      p.token = JSON.parse(p.paymentData);
    } else {
      var buf = new Buffer(p.paymentData, 'base64');
      p.token = JSON.parse(buf.toString());
    }
  }

  p.save(function (err) {
    if (err) {
      console.log("Error saving token: "+err)
      res.end()
    } else {
      adyen_helper.send(req.user, p, function (err, data, json){
        res.redirect('/payments/'+p._id)
      })
    }

  });
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

    if (q) q = JSON.stringify(q)
    res.render('payments', {title: "Payments", payments: ps, query: q})
  })
});

router.get('/:id', function(req, res){
  var id = req.params.id
  var field = req.params.field
  var dateFormat = 'MM.DD.YYYY';

  Payment.findById(id).populate('operations').exec(function (err, doc) {
    if (err) {
      console.log(err)
      res.end(err)
      return
    }


    if (!doc.merchant) {
      doc.merchant = req.user;
      doc.save(function(err){
        if (err) console.log(err);
      })
    }

    doc = doc.toObject();

    if (field != null) {
      doc = doc[field]
    }

    doc.currency = currencyFormat(doc.currencyCode);

    if (!doc.operations) doc.operations = [];
    if (!doc.notifications) doc.notifications = [];

    res.render('payment_item', { title: "Payment", p: doc });
  });
});

router.get('/:id/operation/:opid/delete', function(req, res){
  var id = req.params.id
  var opid = req.params.opid

  PaymentOperation.findById(opid).remove().exec();
  res.redirect('/payments/'+id)
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

    adyen_helper.send(req.user, doc, function (err, data, json){
      res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
      res.redirect('back')
    })

  })
});

module.exports.router = router;
