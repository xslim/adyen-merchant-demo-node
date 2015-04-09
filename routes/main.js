var express = require('express');
var router = express.Router();
var passport = require('passport');

router.get('/', function(req, res) {
  // Display the Login page with any flash message, if any
	if (req.user) {
		res.redirect('/payments')
	} else {
		res.redirect('/login')
	}
  // res.render('index', { message: req.flash('message') });
});

router.get('/login', function(req, res) {
  // Display the Login page with any flash message, if any
  res.render('login', { title: 'Login', message: req.flash('message') });
});

router.post('/login', passport.authenticate('login', {
  successRedirect: '/payments',
  failureRedirect: '/',
  failureFlash : true
}));

router.get('/signup', function(req, res){
  res.render('register',{message: req.flash('message')});
});

router.post('/signup', passport.authenticate('signup', {
  successRedirect: '/payments',
  failureRedirect: '/signup',
  failureFlash : true
}));

router.get('/signout', function(req, res) {
  req.logout();
  res.redirect('/');
});


module.exports.router = router;
