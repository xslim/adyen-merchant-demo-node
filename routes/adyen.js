var express = require('express')
var Adyen  = require('../adyen');

var router = express.Router();

var mongoose = require('mongoose');
var Merchant = mongoose.model('Merchant');
var Payment = mongoose.model('Payment');

router.post('/notification', function(req, res){

  console.log('incoming:', req.body);
});


module.exports.router = router;
