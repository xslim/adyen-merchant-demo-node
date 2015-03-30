var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var PaymentSchema = Schema({
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
  cryptogram: String,
  status: String
})


PaymentSchema.statics = {

}

mongoose.model('Payment', PaymentSchema);

