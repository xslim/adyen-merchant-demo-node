var fs = require('fs'),
    env = require('node-env-file'),
    express = require('express'),
    bodyParser = require('body-parser'),
    cookieParser = require('cookie-parser'),
    expressSession = require('express-session'),
    path = require('path');

var dump = require('./dump')

if (fs.existsSync(__dirname + '/.env' )) {
  env(__dirname + '/.env')
}

// ------ Database

var mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI || "localhost");

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


console.log("Running on " + port);

// if (process.env.MONGOHQ_URL != null) {
//   var storage = require('storage')
//   storage.connect()
// }
app.set('views', __dirname + '/views')
app.set('view engine', 'jade')
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(expressSession({secret: 'mySecretKey'}));

var flash = require('connect-flash');
app.use(flash());

// Auth
var auth = require('./auth')
auth.configureExpress(app);


app.use(function (req, res, next) {
  res.locals.user = req.user;
  next();
});

app.locals.moment = require('moment');

app.listen(port)

app.use('/', require('./routes/main').router);
app.use('/user',      auth.authUser, require('./routes/user').router);
app.use('/payments',  auth.authUser, require('./routes/payment').router);
app.use('/api',       auth.authApi,  require('./routes/api').router);

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
