var express = require('express')
var Adyen  = require('../adyen');

var router = express.Router();

var mongoose = require('mongoose');
var Merchant = mongoose.model('Merchant');
var Payment = mongoose.model('Payment');

router.post('/notification', function(req, res){
  var data = req.body;

  console.log('incoming:', JSON.stringify(req.body));

  if (data.notificationItems) {
    data.notificationItems.forEach(function(item){
      if (item.NotificationRequestItem) {
        console.log(item.NotificationRequestItem)
      }

    });
  }

  res.end();

});


module.exports.router = router;
