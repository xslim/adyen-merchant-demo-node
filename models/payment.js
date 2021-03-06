var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var PaymentSchema = new Schema({
  date: { type: Date, default: Date.now },
  merchant: { type: Schema.Types.ObjectId, ref: 'User' },

  sent: Date,
  sentResponse: String,
  responseBody: String,
  pspReference: String,

  paymentMethod: String,
  merchantIdentifier: String,
  merchantReference: String,
  amount: Number,
  currencyCode: String,
  countryCode: String,
  applicationData: String,

  paymentInstrumentName: String,
  paymentNetwork: String,
  transactionIdentifier: String,
  paymentData: String,

  billingAddress: {
    name: String,
    email: String,
    phone: String,

    street: String,
    city: String,
    state: String,
    zip: String,
    countryCode: String
  },
  shippingAddress: {
    name: String,
    email: String,
    phone: String,

    street: String,
    city: String,
    state: String,
    zip: String,
    countryCode: String
  },

  shippingMethod: String,

  token: Object,
  pgResponse: Object,
  notification: Object,
  cryptogram: String,
  status: String,
  operations: [{ type: Schema.Types.ObjectId, ref: 'PaymentOperation' }],
  notifications: []
});

PaymentSchema.methods.newOperation = function(type) {
  var p = this;
  var PaymentOperation = mongoose.model('PaymentOperation');
  var paymentOperation = new PaymentOperation({
    paymentId: p._id,
    reference: p.merchantReference,
    action:    type
  });

  paymentOperation.save(function(err){
    p.operations.push(paymentOperation);
    p.save();
  });
  return paymentOperation;
}

PaymentSchema.methods.newAuthOperation = function(type, res) {
  var operation = this.newOperation(type);

  operation = operation.updateFromAdyen(res);
  this.sentResponse = operation.result;

  // this is Authorise payment, the PSP Ref will be the main, so override it
  if (operation.pspReference) {
    this.pspReference = operation.pspReference;
  }

  this.save();
  return operation;
}

PaymentSchema.statics = {

}

mongoose.model('Payment', PaymentSchema);
