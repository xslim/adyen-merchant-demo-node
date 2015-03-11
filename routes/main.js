var express = require('express');
var router = express.Router();

var storage = require('../db').storage

router.get('/ping', function(req, res){
  res.send("PONG")
});

router.get('/about', function(req, res){
  var content = "Developed by Taras Kalapun <t@kalapun.com> for Adyen B.V.";
  res.render('index', { title: 'About', message: content });
});

router.get('/', function(req, res){
  var env = process.env.api_env
  res.render('index', { title: 'Merchant', env: env });
});

router.get('/env', function(req, res){

  var env = process.env.api_env
  var envs = [
  {type: 'dev',  endpoint: storage.getCredentials('dev').endpoint},
  {type: 'test', endpoint: storage.getCredentials('test').endpoint},
  {type: 'live', endpoint: storage.getCredentials('live').endpoint}
  ]

  res.render('env', { title: 'Merchant', env: env, envs:envs });
});

router.get('/env/:type', function(req, res){
  var type = req.params.type
  process.env['api_env'] = type;
  //res.end(type)
  res.redirect('/')
});



module.exports.router = router;
