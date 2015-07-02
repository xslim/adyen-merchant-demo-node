var express = require('express'),
  router = express.Router(),
  Adyen = require('../adyen'),
  adyen_helper  = require('../adyen_helper');

var mongoose = require('mongoose');
var User = mongoose.model('User');
var Payment = mongoose.model('Payment');


router.post('/adyen/notification', function(req, res){
  var notes = Adyen.parseNotifications(req.body);

  //console.log('incoming:', JSON.stringify(req.body));

  notes.forEach(function(note){
    Payment.findOneAndUpdate(
      {'pspReference': note.pspReference},
      {$push: {notifications: note}},
      function(err, item){
        if (err) {
          console.log('Payment ' + psp + 'update failed: ', err);
        }
      });
  });

  res.json(Adyen.responses.notification);
});

router.post('/shipping', function(req, res){
  var record = req.body;
  console.log('Shipping to', record);

  var sm_l_nd = { identifier: 'sm_l_nd', label: 'Next day', amount: '0.0', detail: 'Next day delivery' }
  var sm_l_ex = { identifier: 'sm_l_ex', label: 'Express', amount: '3.0', detail: 'This day express delivery' }
  var sm_i_nd = { identifier: 'sm_i_nd', label: 'Int Next day', amount: '6.0', detail: 'International Next day delivery' }
  var sm_i_ex = { identifier: 'sm_i_ex', label: 'Int Express', amount: '20.0', detail: 'International This day express delivery' }

  if (record.countryCode == 'GB') {
    res.json([sm_l_nd, sm_l_ex]);
  } else if (record.countryCode == 'US') {
    res.json([sm_i_nd, sm_i_ex]);
  } else {
    console.log('Shipping not supported');
    res.status(400).end();
  }


})

router.post('/payment', function(req, res){
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
      adyen_helper.send(req.user, p, false, function (err, data, json){

        if (json && json.pspReference && json.resultCode == 'Authorised') {
          return res.json(json);
        }
        res.status(500).end();
      })
    }

  });
});

router.get('/config', function(req, res) {
  var user = req.user;
  var platform = user.platform;
  var skin = '';
  if (platform == 'live') {
    skin = req.user.liveHppSkin;
  } else if (platform == 'test') {
    skin = req.user.testHppSkin;
  }

  res.json({
    platform: user.platform,
    merchantAccount: user.merchantAccount,
    skin: skin
  })
});

router.all('/hmac', function(req, res) {

  var platform = req.user.platform;
  var key = '';
  if (platform == 'live') {
    key = req.user.liveHmacKey;
  } else if (platform == 'test') {
    key = req.user.testHmacKey;
  }

  var hash = Adyen.hmac(req.query.text, key)
  // hash = JSON.stringify({"hash": hash})
  res.end(hash)
});

module.exports.router = router;
