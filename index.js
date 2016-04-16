var LEX = require('letsencrypt-express');
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

var lex = LEX.create({
  configDir: require('os').homedir() + '/letsencrypt/etc'
, approveRegistration: function (hostname, cb) { // leave `null` to disable automatic registration
    // Note: this is the place to check your database to get the user associated with this domain
    cb(null, {
      domains: [hostname]
    , email: 'cameroncjones4@gmail.com'
    , agreeTos: true
    });
  }
});

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

router.get('*', ensureSecure);

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

  if (hidden != sess.hidden) {
    res.status(400).end();
  } else if (bitText == '') {
    res.status(400).send('Enter something.');
  } else {
    res.status(200);
    var generatedId = shortid.generate();
    if (req.body.permanent) {
      var bitId = generatedId + '~';
    } else {
      var bitId = generatedId;
    }
    var encryptedBitText = key.encrypt(bitText, 'base64');
    db.put(bitId, encryptedBitText, function(err) {
      var url = req.protocol + '://' + req.hostname + '/' + bitId + '/';
      res.end(url);
      db.get('stats', function (err, value) {
        var count = parseInt(value) + 1;
        db.put('stats', count);
      });
    });
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

router.get('/:bit([a-zA-Z0-9-_]{7,14}\~?\/?$)', function(req, res, next) {
  var bitId = req.params.bit;
  var cleanedId = bitId.replace(/\/$/, "");
  db.get(cleanedId, function (err, value) {
    if (err) {
      next();
    } else {
      var decryptedValue = key.decrypt(value, 'utf8');
      res.render('pages/bit', { bitId: cleanedId, bit: decryptedValue });
      if (!bitId.includes('~')) {
        db.del(cleanedId);
      }
    }
  });
});

router.get('*', function(req, res) {
  var path = req.url;
  var regex = new RegExp(/\/[a-zA-Z0-9-_]{7,14}\~?\/?$/);
  if (regex.test(path)) {
    var error = "The bit you have tried to access has already disappeared or was never created.";
  } else {
    var error = "The file you were looking for cannot be found.";
  }
  res.status(404).render('pages/error', { error: error });
});

app.use('/', router);

function ensureSecure(req, res, next) {
  if (req.secure || req.headers.host == "localhost") {
    next();
  } else {
    res.redirect('https://' + req.hostname + req.url);
  }
}

lex.onRequest = app;
lex.listen([80], [443, 5001], function () {
  var protocol = ('requestCert' in this) ? 'https': 'http';
  console.log("Magic happens at " + protocol + '://localhost:' + this.address().port);
});
