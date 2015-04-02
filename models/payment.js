var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var PaymentSchema = new Schema({
  date: { type: Date, default: Date.now },

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

PaymentSchema.methods.newOperation = function (type) {
  var PaymentOperation = mongoose.model('PaymentOperation');
  var paymentOperation = new PaymentOperation({
    paymentId: this._id,
    reference: this.merchantReference,
    action:    type
  });
  paymentOperation.save();
  this.operations.push(paymentOperation);
  this.save();
  return paymentOperation;
}

PaymentSchema.statics = {

}

mongoose.model('Payment', PaymentSchema);
