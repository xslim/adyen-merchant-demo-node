var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var PaymentOperationSchema = Schema({
  paymentId:    { type: Schema.Types.ObjectId, ref: 'Payment' },
  date:         { type: Date, default: Date.now },

  action:       String,
  reference:    String,
  pspReference: String,
  result:       String,

  sent:         Object,
  response:     Object,
  notification: Object,
})

PaymentOperationSchema.methods.updateFromAdyen = function (res) {
  if (!res) {
    return this;
  }

  // Mongo will not save if there is a '.' in field... which we have...
  //var sd = JSON.stringify(sentData);
  //paymentOperation.sent = sd;

  this.response = res;
  // last result
  var result = res['resultCode'];
  if (res['refusalReason']) {
    result = res['refusalReason'];
  } else if (res['errorCode']) {
    result = res['errorCode'];
  }

  this.result = result;

  if (res['pspReference']) {
    this.pspReference = res['pspReference'];
  }

  this.save(function (err) {
    if (err) {
      console.log('error saving paymentOperation', err);
    }
  });

  return this;
}

PaymentOperationSchema.statics = {

}

mongoose.model('PaymentOperation', PaymentOperationSchema);
