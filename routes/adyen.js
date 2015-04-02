var express = require('express')
var Adyen  = require('../adyen');

var router = express.Router();

var mongoose = require('mongoose');
var Merchant = mongoose.model('Merchant');
var Payment = mongoose.model('Payment');

router.post('/notification', function(req, res){
  var data = req.body;

  //console.log('incoming:', JSON.stringify(req.body));

  if (data.notificationItems) {
    data.notificationItems.forEach(function(item){
      if (item.NotificationRequestItem) {
        var note = item.NotificationRequestItem;
        var psp = note.pspReference;

        Payment.findOneAndUpdate({'pspReference': psp}, {$set: {notification: note}}, function(err, item){
          if (err) {
            console.log('Payment ' + psp + 'update failed: ', err);
          }
        });
      }

    });
  }

  res.end();

});


module.exports.router = router;
