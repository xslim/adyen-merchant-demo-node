var fs = require('fs'),
    env = require('node-env-file'),
    express = require('express'),
    path = require('path'),
    passport = require('passport'),
    BasicStrategy = require('passport-http').BasicStrategy

var bodyParser = require('body-parser');

var dump = require('./dump')

if (fs.existsSync(__dirname + '/.env' )) {
  env(__dirname + '/.env')
}

var app  = express();
var port = process.env.PORT || 8080;

passport.use(new BasicStrategy(
  function(username, password, done) {
    if (username == process.env.login && password == process.env.password) {
      return done(null, {name: "User"});
    } else {
      return done(null, false);
    }
  }
));

console.log("Running on " + port);

// if (process.env.MONGOHQ_URL != null) {
//   var storage = require('storage')
//   storage.connect()
// }

app.use(passport.initialize());
app.set('views', __dirname + '/views')
app.set('view engine', 'jade')
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(express.static(path.join(__dirname, 'public')));


app.listen(port)

app.use('/', require('./routes/main').router);
app.use('/hmac', require('./routes/hmac').router);
app.use('/payments', require('./routes/payment').router);
