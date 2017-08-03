/**
 * bit - secure text transmission system
 * @author Cameron Jones
 */

'use strict'

/* REQUIRES */
const express = require('express')
const session = require('express-session')
const bodyparser = require('body-parser')

const triplesec = require('triplesec')
const crypto = require('crypto')
const shortid = require('shortid')

const mongoose = require('mongoose')

const marked = require('marked')
const hbs = require('hbs')

const Bit = require('./models/Bit')

/* EXPRESS APP INITIALIZATION */
const app = express()

/* DECLARE PORT*/
const port = 80

/* MONGODB CONNECT & PROMISE WORKAROUND */
mongoose.Promise = global.Promise
mongoose.connect('mongodb://localhost/bit')

/* CHANGE SHORTID SEED */
shortid.seed(1738)

/* FIX MARKED HEADING RENDERER */
const renderer = new marked.Renderer()
renderer.heading = (text, level) => {
  return '<h' + level + '>' + text + '</h' + level + '>';
}
marked.setOptions({
  renderer: renderer,
  sanitize: true
})

/* SETUP BODYPARSER & SESSION */
app.use(bodyparser.urlencoded({ extended: false }))
app.use(session({
  genid: (req) => {
    return shortid.generate()
  },
  secret: crypto.randomBytes(64).toString('hex'),
  resave: false,
  saveUninitialized: false
}))

/* SET VIEW ENGINE */
app.set('view engine', 'html')
app.engine('html', hbs.__express)

/* REDIRECT INSECURE REQUESTS TO HTTPS */
app.use('*', (req, res, next) => {
  if (req.secure || req.headers.host == 'localhost') {
    next()
  } else {
    res.redirect('https://' + req.hostname + req.url)
  }
})

/* MAIN PAGE */
app.get('/', (req, res) => {
  const sess = req.session
  const hidden = shortid.generate()
  sess.hidden = hidden
  res.render('main', { hidden: hidden })
})

/* HANDLE BIT CREATION & ENCRYPTION */
app.post('/', (req, res) => {
  const sess = req.session
  const hidden = req.body.hidden
  let content = req.body.text.trim()
  const hiddenSession = sess.hidden
  if (hidden != hiddenSession) {
    return res.status(400).json({
      message: 'Please don\'t tamper with bit!',
      reload: true
    })
  }
  if (content == '') {
    return res.status(400).json({
      message: 'Your bit must have text.',
      reload: false
    })
  }
  if (content.length > 10000) {
    return res.status(400).json({
      message: 'Your bit is too long.',
      reload: false
    })
  }
  if (req.body.encrypted == 'true' && req.body.key == '') {
    return res.status(400).json({
      message: 'Your key must have text.',
      reload: false
    })
  }
  res.status(200)
  let bitid = shortid.generate()
  if (req.body.permanent == 'true') bitid += '~'
  let key
  content = marked(content)
  if (req.body.encrypted == 'true') {
    key = req.body.key
  } else {
    key = 'CONSTANTKEY'
  }
  triplesec.encrypt({
    data: new triplesec.Buffer(content),
    key: new triplesec.Buffer(key),
    progress_hook: (obj) => {}
  }, (err, buff) => {
    if (!err) {
      const processed = buff.toString('hex')
      const bit = new Bit({
        _id: bitid,
        text: processed,
        encrypted: req.body.encrypted == 'true',
        permanent: req.body.permanent == 'true'
      })
      bit.save((err, output) => {
        if (err) return console.error(err)
        const url = `${req.protocol}://${req.hostname}/${bitid}/`
        res.end(url)
      })
    } else {
      return res.status(400).json({
        message: 'Encryption failed, please try again later.',
        reload: false
      })
    }
  })
})

/* HANDLE BIT VIEWING & DECRYPTION */
app.get('/:bit([a-zA-Z0-9-_]{7,14}\~?\/?$)', (req, res, next) => {
  const bitid = req.params.bit
  const cleanid = bitid.replace(/\/$/, '')
  Bit.find({ _id: cleanid }, (err, bits) => {
    if (err || bits.length != 1) return next()
    const bit = bits[0]
    res.render('bit', { bitid: cleanid, bit: bit.text })
    if (!bit.permanent) {
      bit.remove()
    }
  })
})

/* SERVER STATIC FILES */
app.use(express.static('static'))

/* HANDLE 404 ERRORS */
app.get('*', (req, res) => {
  const path = req.url
  const regex = new RegExp(/\/[a-zA-Z0-9-_]{7,14}\~?\/?$/)
  let error
  if (regex.test(path)) {
    error = 'The bit you have tried to access has already disappeared or was never created.'
  } else {
    error = 'The page you were looking for cannot be found.'
  }
  res.status(404).render('error', { error: error })
})

/* LISTEN ON SPECIFIED PORT */
app.listen(port, () => {
  console.log(`Listening on port ${port}`)
})
