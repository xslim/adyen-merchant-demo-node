var passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy,
    BearerStrategy = require('passport-http-bearer').Strategy;

var mongoose = require('mongoose');
var User = mongoose.model('User');

var bCrypt = require('bcrypt-nodejs');

var isValidPassword = function(user, password){
  return bCrypt.compareSync(password, user.password);
}

// Generates hash using bCrypt
var createHash = function(password){
  return bCrypt.hashSync(password, bCrypt.genSaltSync(10), null);
}

var configurePassport = function(passport) {

  passport.serializeUser(function(user, done) {
    done(null, user._id);
  });

  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });

  passport.use('login', new LocalStrategy({
            passReqToCallback : true
        },
        function(req, username, password, done) {
            // check in mongo if a user with username exists or not
            User.findOne({ 'username' :  username },
                function(err, user) {
                    // In case of any error, return using the done method
                    if (err)
                        return done(err);
                    // Username does not exist, log the error and redirect back
                    if (!user){
                        console.log('User Not Found with username '+username);
                        return done(null, false, req.flash('message', 'User Not found.'));
                    }
                    // User exists but wrong password, log the error
                    if (!isValidPassword(user, password)){
                        console.log('Invalid Password');
                        return done(null, false, req.flash('message', 'Invalid Password')); // redirect back to login page
                    }
                    // User and password both match, return user from done method
                    // which will be treated like success
                    return done(null, user);
                }
            );

        })
    );

    passport.use('signup', new LocalStrategy({
            passReqToCallback : true // allows us to pass back the entire request to the callback
        },
        function(req, username, password, done) {

            findOrCreateUser = function(){
                // find a user in Mongo with provided username
                User.findOne({ 'username' :  username }, function(err, user) {
                    // In case of any error, return using the done method
                    if (err){
                        console.log('Error in SignUp: '+err);
                        return done(err);
                    }
                    // already exists
                    if (user) {
                        console.log('User already exists with username: '+username);
                        return done(null, false, req.flash('message','User Already Exists'));
                    } else {
                        // if there is no user with that email
                        // create the user
                        var newUser = new User();

                        // set the user's local credentials
                        newUser.username = username;
                        newUser.password = createHash(password);
                        newUser.email = req.param('email');
                        newUser.name = req.param('name');

                        // save the user
                        newUser.save(function(err) {
                            if (err){
                                console.log('Error in Saving user: '+err);
                                throw err;
                            }
                            console.log('User Registration succesful');
                            return done(null, newUser);
                        });
                    }
                });
            };
            // Delay the execution of findOrCreateUser and execute the method
            // in the next tick of the event loop
            process.nextTick(findOrCreateUser);
        })
    );

    passport.use(new BearerStrategy(
      function(token, done) {
        User.findOne({ token: token }, function (err, user) {
          if (err) { return done(err); }
          if (!user) { return done(null, false); }
          return done(null, user, { scope: 'all' });
        });
      }
    ));

};

module.exports = {

  configureExpress: function(app) {
    app.use(passport.initialize());
    app.use(passport.session());

    configurePassport(passport);
  },

  authUser: function(req, res, next) {
    // if user is authenticated in the session, call the next() to call the next request handler
    // Passport adds this method to request object. A middleware is allowed to add properties to
    // request and response objects
    if (req.isAuthenticated())
      return next();
    // if the user is not authenticated then redirect him to the login page
    req.session.redirect_to = req.originalUrl;
    res.redirect('/login');
  },

  authApi: function(req, res, next) {
    return passport.authenticate('bearer', { session: false })(req, res, next)
  }
};
