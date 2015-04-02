var express = require('express')
var Adyen  = require('../adyen');

var router = express.Router();

var mongoose = require('mongoose');
var Merchant = mongoose.model('Merchant');
var Payment = mongoose.model('Payment');

router.post('/notification', function(req, res){
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


module.exports.router = router;
