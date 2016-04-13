var express = require('express');
var session = require('express-session');
var shortid = require('shortid');
var bodyParser = require('body-parser');
var levelup = require('levelup')
var app = express();
var router = express.Router();
var port = process.env.PORT || 80;
shortid.seed(1942);

var db = levelup('./bit')

app.set('view engine', 'ejs');
app.use(express.static('static'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({
  genid: function(req) {
    return shortid.generate();
  },
  secret: 'a8dm38dsnw02n5n7k10dj',
  resave: false,
  saveUninitialized: false
}));

router.get('/', function(req, res) {
  var sess = req.session;
  var hidden = shortid.generate();
  sess.hidden = hidden;
  res.render('pages/main', { hidden: hidden });
});

router.post('/', function(req, res) {
  var sess = req.session;
  var hidden = req.body.hidden;

  if (hidden != sess.hidden) {
    res.status(401);
    res.end();
  } else if (req.body.text == '') {
    res.status(401);
    res.end('Enter something.');
  } else {
    res.status(200);
    var bitId = shortid.generate();
    //encryption goes here
    db.put(bitId, req.body.text, function() {
      var url = '<a target="_blank" href="http://localhost/' + bitId + '/">here</a>.'
      res.send(url);
    });
  }
});

router.get('/:bit([a-zA-Z0-9-_]{7})', function(req, res, next) {
  db.get(req.params.bit, function (err, value) {
    if (err) next(); //add better error handling
    //decryption goes here
    res.end(value);
  });
});

router.get('*', function(req, res){
  res.status(404).send("404 ERROR")
});

app.use('/', router);

app.listen(port);
console.log('Magic happens on port ' + port);
