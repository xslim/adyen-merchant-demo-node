var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var MerchantSchema = new Schema({
  name: { type: String, default: '' },
  email: { type: String, default: '' },
  username: { type: String, default: '' },
});

MerchantSchema.statics = {

}

mongoose.model('Merchant', MerchantSchema);

