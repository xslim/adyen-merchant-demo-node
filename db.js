var mongoose = require('mongoose');
var Schema = mongoose.Schema;


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

module.exports.storage = {
  getCredentials: function(env) {
    return getCredentials(env)
  }
};
