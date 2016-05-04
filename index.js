'use strict';

var letsencrypt = require('letsencrypt-express');
var express = require('express');
var session = require('express-session');
var shortid = require('shortid');
var bodyParser = require('body-parser');
var levelup = require('levelup');
var NodeRSA = require('node-rsa');
var moment = require('moment');
var app = express();
var router = express.Router();
var port = process.env.PORT || 80;
shortid.seed(6899);

/* Today's date and bits made today for stats */
var statsTodayDate = moment().format('MMMM Do, YYYY');
var statsBitsMadeToday = 0;

var startMoment = moment();
/*
Total bits created before last restart
NOTE: THIS IS MANUAL
*/
var totalBitsBeforeRestart = 200;
//const does not work in mozilla -- thanks travis-ci
//const firstDay = moment("04 16 2016", "MM DD YYYY");
var firstDay = moment("04 16 2016", "MM DD YYYY");

var db = levelup('./bit', { db: require('memdown') });
db.put('stats', 0);
var key = new NodeRSA({b: 512});

var lex = letsencrypt.create({
  configDir: require('os').homedir() + '/letsencrypt/etc', approveRegistration: function (hostname, cb) {
    cb(null, { domains: [hostname], email: 'cameroncjones4@gmail.com', agreeTos: true });
  }
});

app.set('view engine', 'ejs');
app.use(express.static('static'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({
  genid: function(req) {
    return shortid.generate();
  },
  secret: 'aj4jwhjdhbf78JDIOjkhk=-_8968fs_89itghJGJHFLDSJK6e3#_P-3',
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
  } else if (bitText === '') {
    res.status(400).send('Enter something.');
  } else {
    res.status(200);
    var generatedId = shortid.generate();
    var bitId;
    if (req.body.permanent) {
      bitId = generatedId + '~';
    } else {
      bitId = generatedId;
    }
    var encryptedBitText = key.encrypt(bitText, 'base64');
    db.put(bitId, encryptedBitText, function(err) {
      var url = req.protocol + '://' + req.hostname + '/' + bitId + '/';
      res.end(url);
      db.get('stats', function (err, value) {
        var todaysDate = moment().format('MMMM Do, YYYY');
        if (statsTodayDate !== todaysDate) {
          statsBitsMadeToday = 1;
          statsTodayDate = todaysDate;
        } else {
          statsBitsMadeToday = statsBitsMadeToday + 1;
        }
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
      var todaysDate = moment().format('MMMM Do, YYYY');
      if (statsTodayDate !== todaysDate) {
        statsTodayDate = todaysDate;
        statsBitsMadeToday = 0;
      }
      var allBitsBeforeToday = totalBitsBeforeRestart + parseInt(value) - statsBitsMadeToday;
      var daysSiteUp = Math.round(moment.duration(moment().diff(firstDay)).asDays()-1);
      var averageBitsPerDay = Math.round(allBitsBeforeToday/daysSiteUp);
      res.render('pages/stats', {
        bitsAlltime: value,
        startFromNow: startMoment.calendar(),
        bitsToday: statsBitsMadeToday,
        avgBitsPerDay: averageBitsPerDay,
        allBitsEver: totalBitsBeforeRestart + parseInt(value)
      });
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
  var error;
  if (regex.test(path)) {
    error = "The bit you have tried to access has already disappeared or was never created.";
  } else {
    error = "The file you were looking for cannot be found.";
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
