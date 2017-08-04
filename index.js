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
  const hiddenSession = sess.hidden

  const content = req.body.text
  let hashedKey = req.body.hashedKey
  const encrypted = req.body.encrypted == 'true'
  const permanent = req.body.permanent == 'true'
  if (hidden != hiddenSession) return res.status(400).end('Please reload the page to continue.')
  if (content.length/2 == 208) return res.status(400).end('Your bit must be at least one character.')
  if (encrypted == 'true' && hashedKey == '') return res.status(400).end('You must have an encryption key.')
  if (content.length > 10000) return res.status(400).end('Your bit is too long.')
  if (!encrypted) hashedKey = undefined

  let bitid = shortid.generate()
  if (permanent) bitid += '~'

  const bit = new Bit({
    _id: bitid,
    text: content,
    hashedKey: hashedKey,
    permanent: permanent
  })
  bit.save((err, output) => {
    if (err) return res.status(400).end('Error saving bit, try again later.')
    const url = `${req.protocol}://${req.hostname}/${bitid}/`
    res.status(200).end(url)
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
