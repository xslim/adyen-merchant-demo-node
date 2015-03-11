var mongoose = require('mongoose');
var Schema = mongoose.Schema;

mongoose.connect(process.env.MONGOHQ_URL || "localhost");

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function callback () {
  // console.log('Connected!')
});

function getCredentials(env) {
  var cred = {}

  var env_type = env || process.env.api_env

  if (env_type == 'test') {
    cred['endpoint'] = process.env.test_endpoint
    cred['userpass'] = process.env.test_userpass
    cred['merchant'] = process.env.test_merchant
  } else if (env_type == 'live') {
    cred['endpoint'] = process.env.live_endpoint
    cred['userpass'] = process.env.live_userpass
    cred['merchant'] = process.env.live_merchant
  } else {
    //dev
    cred['endpoint'] = process.env.dev_endpoint
    cred['userpass'] = process.env.dev_userpass
    cred['merchant'] = process.env.dev_merchant
  }


  return cred
}

var paymentSchema = Schema({
  date: { type: Date, default: Date.now },

  sent: Date,
  sentResponse: String,
  responseBody: String,

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
  cryptogram: String,
  status: String
})
var Payment = mongoose.model('Payment', paymentSchema)

module.exports.db = db;
module.exports.Payment = Payment;
module.exports.storage = {
  getCredentials: function(env) {
    return getCredentials(env)
  }
};
