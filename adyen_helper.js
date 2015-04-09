var Adyen = require('./adyen');

var mongoose = require('mongoose');
var User = mongoose.model('User');
var Payment = mongoose.model('Payment');
var PaymentOperation = mongoose.model('PaymentOperation');

function adyen4user(user) {
  var platform = user.platform;
  var userpass = (platform == 'live') ? user.liveApiUserpass : user.testApiUserpass;

  var adyen = new Adyen({
    host: Adyen.endpoint(platform),
    userpass: userpass,
    merchantAccount: user.merchantAccount
  });
  return adyen;
}

function send_adyen(user, doc, callback) {
  var adyen = adyen4user(user);

  adyen.authoriseApplePay(doc.merchantReference,
    doc.paymentData,
    doc.currencyCode,
    Adyen.amount2minorUnits(doc.amount),
    function(err, res, sentData){

      //console.log('Sending to Adyen', err, res, sentData);

      if (err && !res) {
        res = err;
      }

      var operation = doc.newAuthOperation('authoriseApplePay', res);

      if (err) {
        return callback(true, null, res);
      }

      if (operation.result) {
        callback(null, operation.result, res);
      } else {
        callback(true, null, res);
      }
  });
}

module.exports = {
  send: send_adyen
};
