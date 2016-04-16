var express = require('express');
var session = require('express-session');
var shortid = require('shortid');
var bodyParser = require('body-parser');
var levelup = require('levelup')
var NodeRSA = require('node-rsa');
var moment = require('moment');
var app = express();
var router = express.Router();
var port = process.env.PORT || 80;
shortid.seed(6899);

var db = levelup('./bit', { db: require('memdown') });
db.put('stats', 0);
var key = new NodeRSA({b: 512});
var dateOfStart = moment().format('MMMM Do, YYYY');
var timeOfStart = moment().format('h:mm:ss A');

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
  var bitText = req.body.text;
  var permanent = req.body.permanent;
  if (permanent === undefined)
  {
    permanent = false;
  }
  else if (permanent === "true")
  {
    permanent = true;
  }

  if (hidden != sess.hidden) {
    res.status(400).end();
  } else if (bitText == '') {
    res.status(400).send('Enter something.');
  } else {
    res.status(200);
    var bitId = shortid.generate();
    var encryptedBitText = key.encrypt(bitText, 'base64');
    db.put(bitId, encryptedBitText, function(err) {
      var url = req.protocol + '://' + req.hostname + '/' + bitId + '/';
      res.end(url);
      db.get('stats', function (err, value) {
        var count = parseInt(value) + 1;
        db.put('stats', count);
      });
    });
    db.put(bitId + "_permanent", permanent);
  }
});

router.get('/stats', function(req, res, next) {
  db.get('stats', function (err, value) {
    if (err) {
      next();
    } else {
      res.render('pages/stats', { stats: value, startDate: dateOfStart, startTime: timeOfStart });
    }
  });
});

router.get('/:bit([a-zA-Z0-9-_]{7,14})', function(req, res, next) {
var bitId = req.params.bit;
  db.get(bitId, function (err, value) {
    if (err) {
      next();
    } else {
      var decryptedValue = key.decrypt(value, 'utf8');
      res.render('pages/bit', { bitId: bitId, bit: decryptedValue });
    }
    db.get(bitId + "_permanent", function (err, value) {
      console.log(value);
      if (err)
      {
        next();
      }
      else if (value==="true")
      {
        //do nothing
      }
      else
      {
        db.del(bitId);
      }
    });
  });
});

router.get('*', function(req, res) {
  var path = req.url;
  var regex = new RegExp('/[a-zA-Z0-9-_]{7,14}/?$');
  if (regex.test(path)) {
    var error = "The bit you tried to access has already disappeared or was never created.";
  } else {
    var error = "The file you were looking for cannot be found.";
  }
  res.status(404).render('pages/error', { error: error });
});

app.use('/', router);

app.listen(port);
console.log('Magic happens on port ' + port);
