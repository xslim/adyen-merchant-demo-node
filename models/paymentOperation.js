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


PaymentOperationSchema.statics = {

}

mongoose.model('PaymentOperation', PaymentOperationSchema);
