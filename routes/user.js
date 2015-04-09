var express = require('express');
var router = express.Router();

var mongoose = require('mongoose');
var User = mongoose.model('User');

router.get('/settings', function(req, res) {
  res.render('settings');
});

router.post('/settings', function(req, res) {
	var user_s = req.body;
	var user = req.user;

	User.findOneAndUpdate(
		{'_id': req.user._id},
		{$set: user_s},
		function(err, user){
			if (err) {
				console.log('User ' + req.user._id + 'update failed: ', err);
			}

			res.render('settings', {user: user});
		});

});

module.exports.router = router;
