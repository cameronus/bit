/**
 * bit - secure text transmission system
 * @author Cameron Jones
 */

'use strict'

/* REQUIRES */
const express = require('express')
const session = require('express-session')
const bodyparser = require('body-parser')
const crypto = require('crypto')
const bcrypt = require('bcryptjs')
const shortid = require('shortid')
const mongoose = require('mongoose')
const https = require('https')
const hbs = require('hbs')
const fs = require('fs')

const Bit = require('./models/Bit')

const config = require('./config.json')

const privatekey = fs.readFileSync('privatekey.pem')
const certificate = fs.readFileSync('certificate.pem')

/* EXPRESS APP INITIALIZATION */
const app = express()

/* DECLARE PORT*/
const port = 80

/* MONGODB CONNECT & PROMISE WORKAROUND */
mongoose.Promise = global.Promise
mongoose.connect('mongodb://localhost/bit')

/* CHANGE SHORTID SEED */
shortid.seed(1738)

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

  let triesLeft = 3

  const content = req.body.text.trim()
  let hashedKey = req.body.hashedKey
  const encrypted = req.body.encrypted == 'true'
  const permanent = req.body.permanent == 'true'

  if (hidden != hiddenSession) return res.status(400).end('Please reload the page to continue.')
  if (content.length/2 == 208) return res.status(400).end('Your bit must be at least one character.')
  if (encrypted && hashedKey == '') return res.status(400).end('You must have an encryption key.')
  if (!encrypted && content.length > 10000) return res.status(400).end('Your bit is too long.')
  if (encrypted && content.length > 40000) return res.status(400).end('Your bit is too long.')
  if (hashedKey.length > 2000) return res.status(400).end('Your encryption key is too long.')
  if (!encrypted) {
    hashedKey = undefined
    triesLeft = undefined
  }

  let bitid = shortid.generate()
  if (permanent) bitid += '~'
  const bit = new Bit({
    _id: bitid,
    text: content,
    encrypted: encrypted,
    hashedKey: hashedKey,
    triesLeft: triesLeft,
    permanent: permanent
  })
  bit.save((err, output) => {
    if (err) return res.status(400).end('Error saving bit, try again later.')
    res.status(200).end(`${req.protocol}://${req.hostname}/${bitid}/`)
  })
})

/* HANDLE BIT CONFIRMATION */
app.get('/:bit([a-zA-Z0-9-_]{7,14}\~?\/?$)', (req, res, next) => {
  const bitid = req.params.bit
  const cleanid = bitid.replace(/\/$/, '')
  Bit.find({ _id: cleanid }, (err, bits) => {
    if (err || bits.length != 1) return next()
    const bit = bits[0]
    const salt = bit.encrypted ? bcrypt.getSalt(bit.hashedKey) : ''
    res.render('bit', { bitid: cleanid, encrypted: bit.encrypted, permanent: bit.permanent, salt: salt })
  })
})

/* HANDLE BIT DECRYPTION & VIEWING */
app.post('/:bit([a-zA-Z0-9-_]{7,14}\~?\/?$)', (req, res, next) => {
  const bitid = req.params.bit
  const cleanid = bitid.replace(/\/$/, '')
  Bit.find({ _id: cleanid }, (err, bits) => {
    if (err || bits.length != 1) return res.status(400).end('The bit you have tried to access has already disappeared.')

    const bit = bits[0]
    const encrypted = bit.encrypted
    const permanent = bit.permanent
    const hashedKey = req.body.hashedKey

    if (!encrypted) {
      res.status(200).end(bit.text)
      if (!permanent) bit.remove()
      return
    }

    const match = hashedKey == bit.hashedKey
    if (!match && permanent) return res.status(400).end('You have entered the wrong decryption key.')
    if (!match) {
      bit.triesLeft -= 1
      bit.save((err) => {
        if (bit.triesLeft == 0) {
          res.status(400).end('This bit has disappeared after 3 incorrect attempts to decrypt it.')
          return bit.remove()
        }
        res.status(400).end(`You have entered the wrong decryption key. You have ${bit.triesLeft} more attempt(s).`)
      })
    }
    if (match) {
      res.status(200).end(bit.text)
      if (!permanent) bit.remove()
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

https.createServer({
  key: privatekey,
  cert: certificate
}, app).listen(443, () => {
  console.log('Listening on port 443')
})
