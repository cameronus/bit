"use strict";

const letsencrypt = require('letsencrypt-express'),
    ipfilter = require('express-ipfilter'),
    session = require('express-session'),
    bodyParser = require('body-parser'),
    marky = require('marky-markdown'),
    config = require('./config.json'),
    NodeRSA = require('node-rsa'),
    express = require('express'),
    shortid = require('shortid'),
    levelup = require('levelup'),
    memdown = require('memdown'),
    crypto = require('crypto'),
    moment = require('moment'),
    os = require('os'),
    app = express(),
    router = express.Router(),
    port = process.env.PORT || 80;
shortid.seed(6899);

let statsBitsTotalIncrease = 0;
const firstDay = moment('04 16 2016', 'MM DD YYYY');
const statsTodayDate = moment().format('MMMM Do, YYYY');
let statsBitsMadeToday = 0;
const startMoment = moment();
const totalBitsBeforeRestart = config.totalBitsBeforeRestart;

const db = levelup('./bit', { db: memdown });
db.put('stats', 0);
const key = new NodeRSA({ b: 512 });

const lex = letsencrypt.create({
  configDir: os.homedir() + '/letsencrypt/etc', approveRegistration: function (hostname, cb) {
    cb(null, { domains: [hostname], email: config.certificateEmail, agreeTos: true });
  }
});

app.set('view engine', 'ejs');
app.use(ipfilter(config.bannedIps, { log: false }));
app.use(express.static('static'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({
  genid: function(req) {
    return shortid.generate();
  },
  secret: crypto.randomBytes(64).toString('hex'),
  resave: false,
  saveUninitialized: false
}));

router.get('*', ensureSecure);

router.get('/', function(req, res) {
  const sess = req.session;
  const hidden = shortid.generate();
  sess.hidden = hidden;
  res.render('pages/main', { hidden: hidden });
});

router.post('/', function(req, res) {
  const sess = req.session;
  const hidden = req.body.hidden;
  let bitText = req.body.text;
  const bitLength = bitText.length;
  const hiddenSession = sess.hidden;
  if (hidden != hiddenSession) {
    res.status(400).end();
  } else if (bitText === '') {
    res.status(400).send('Enter something.');
  } else if (bitLength > 10000) {
    res.status(400).send('Bit is too long.');
  } else {
    res.status(200);
    const generatedId = shortid.generate();
    let bitId;
    if (req.body.permanent) {
      bitId = generatedId + '~';
    } else {
      bitId = generatedId;
    }
    bitText = marky(bitText).html();
    const encryptedBitText = key.encrypt(bitText, 'base64');
    db.put(bitId, encryptedBitText, function(err) {
      const url = req.protocol + '://' + req.hostname + '/' + bitId + '/';
      res.end(url);
      const todaysDate = moment().format('MMMM Do, YYYY');
      if (statsTodayDate !== todaysDate) {
        statsBitsMadeToday = 1;
        statsTodayDate = todaysDate;
      } else {
        statsBitsMadeToday++;
      }
      statsBitsTotalIncrease += 1;

      if (statsBitsTotalIncrease == 1) {
        db.get('stats', function (err, value) {
          const count = parseInt(value) + statsBitsTotalIncrease;
          statsBitsTotalIncrease = 0;
          db.put('stats', count);
        });
      }
    });
  }
});

router.get('/stats', function(req, res, next) {
  db.get('stats', function (err, value) {
    if (err) {
      next();
    } else {
      const todaysDate = moment().format('MMMM Do, YYYY');
      if (statsTodayDate !== todaysDate) {
        statsTodayDate = todaysDate;
        statsBitsMadeToday = 0;
      }
      const allBitsBeforeToday = totalBitsBeforeRestart + parseInt(value) - statsBitsMadeToday;
      const daysSiteUp = Math.round(moment.duration(moment().diff(firstDay)).asDays()-1);
      const averageBitsPerDay = Math.round(allBitsBeforeToday/daysSiteUp);
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
  const bitId = req.params.bit;
  const cleanedId = bitId.replace(/\/$/, "");
  db.get(cleanedId, function (err, value) {
    if (err) {
      next();
    } else {
      const decryptedValue = key.decrypt(value, 'utf8');
      res.render('pages/bit', { bitId: cleanedId, bit: decryptedValue });
      if (!bitId.includes('~')) {
        db.del(cleanedId);
      }
    }
  });
});

router.get('*', function(req, res) {
  const path = req.url;
  const regex = new RegExp(/\/[a-zA-Z0-9-_]{7,14}\~?\/?$/);
  let error;
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
  const protocol = ('requestCert' in this) ? 'https' : 'http';
  console.log('Magic happens at ' + protocol + '://localhost:' + this.address().port);
});
