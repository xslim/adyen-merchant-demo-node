var mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  uuid = require('node-uuid');

var UserSchema = new Schema({
  name: String,
  token: { type: String, default: uuid() },
  email: { type: String, default: '' },
  username: String,
  password: String,
  merchantAccount: String,
  platform: { type: String, default: 'live' },
  liveHmacKey: String,
  liveHppSkin: String,
  testHmacKey: String,
  testHppSkin: String,
  liveApiUserpass: String,
  testApiUserpass: String,
});

UserSchema.statics = {

}

mongoose.model('User', UserSchema);
