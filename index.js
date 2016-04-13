var express = require('express');
var session = require('express-session');
var shortid = require('shortid');
var bodyParser = require("body-parser");
var app = express();
var router = express.Router();
var port = process.env.PORT || 80;
shortid.seed(1942);

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
}))


router.get('/', function(req, res) {
  var sess = req.session;
  var hidden = shortid.generate();

  sess.hidden = hidden;
  res.render('pages/main', { hidden: hidden });
});



/*router.post('/', function(req, res) {
  var sess = req.session;
  var hidden = req.body.hidden;
  //handle not in session error & catch all
  if (req.body.text == "") {
    res.render('pages/error', { error: "Enter text into form." });
  } else if (hidden != sess.hidden) {
    res.render('pages/error', { error: "Invalid form submission." });
  } else {
    res.render('pages/success', { success: "success!" });
  }
});*/

/*router.get('/hello/:name', function(req, res) {
  res.send('hello ' + req.params.name + '!');
});*/

router.post('/', function(req, res) {
  res.status(200);
  res.send(req.body.text);
});

app.use('/', router);

app.listen(port);
console.log('Magic happens on port ' + port);
