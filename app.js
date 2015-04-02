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

// ------ Database

var mongoose = require('mongoose');
mongoose.connect(process.env.MONGOHQ_URL || "localhost");

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function callback () {
  // console.log('Connected!')
});

// Bootstrap models
fs.readdirSync(__dirname + '/models').forEach(function (file) {
  if (~file.indexOf('.js')) require(__dirname + '/models/' + file);
});

// ------ / Database

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


app.use(function (req, res, next) {
   res.locals.env = process.env.api_env;
   next();
});

app.listen(port)

app.use('/', require('./routes/main').router);
app.use('/hmac', require('./routes/hmac').router);
app.use('/payments', require('./routes/payment').router);
app.use('/api/adyen', require('./routes/adyen').router);

app.get('/buy', function(req, res){
  var products = [
    {title: "Marker", amount: "2.01", currency: "USD"},
    {title: "Pen",    amount: "0.01", currency: "USD"},
    {title: "Pencil", amount: "0.05", currency: "EUR"},
  ];
  res.render('buy', {
          title: "Buy products via WebView",
          products: products
        });
  });
