'use strict'

const express = require('express')
const session = require('express-session')
const bodyparser = require('body-parser')
const mongoose = require('mongoose')
const shortid = require('shortid')
const crypto = require('crypto')
const marked = require('marked')

const app = express()

const port = 80

mongoose.connect('mongodb://localhost/bit')

app.use(bodyparser.urlencoded({ extended: false }))
app.use(express.static('static'))
app.use(session({
  genid: function(req) {
    return shortid.generate()
  },
  secret: crypto.randomBytes(64).toString('hex'),
  resave: false,
  saveUninitialized: false
}))

app.set('view engine', 'ejs')

app.use('*', (req, res, next) => {
  if (req.secure || req.headers.host == 'localhost') {
    next()
  } else {
    res.redirect('https://' + req.hostname + req.url)
  }
})

app.get('/', function(req, res) {
  const sess = req.session
  const hidden = shortid.generate()
  sess.hidden = hidden
  res.render('pages/main', { hidden: hidden })
})

app.post('/', function(req, res) {
  const sess = req.session
  const hidden = req.body.hidden
  let content = req.body.text.trim()
  const hiddenSession = sess.hidden
  if (hidden != hiddenSession) {
    return res.status(400).json({
      message: '',
      reload: true
    })
  }
  if (content === '') {
    return res.status(400).json({
      message: 'Please enter text to create the bit.',
      reload: false
    })
  }
  if (content.length > 10000) {
    return res.status(400).json({
      message: 'Bit is too long.',
      reload: false
    })
  }
  res.status(200)
  let bitid = shortid.generate()
  if (req.body.permanent) bitid += '~'
  const processedContent = marked(content)
  console.log(processedContent)
  /*const encryptedBitText = key.encrypt(bitText, 'base64')
  db.put(bitId, encryptedBitText, function(err) {
    const url = req.protocol + '://' + req.hostname + '/' + bitId + '/'
    res.end(url)
    const todaysDate = moment().format('MMMM Do, YYYY')
    if (statsTodayDate !== todaysDate) {
      statsBitsMadeToday = 1
      statsTodayDate = todaysDate
    } else {
      statsBitsMadeToday++
    }
    statsBitsTotalIncrease += 1

    if (statsBitsTotalIncrease == 1) {
      db.get('stats', function (err, value) {
        const count = parseInt(value) + statsBitsTotalIncrease
        statsBitsTotalIncrease = 0
        db.put('stats', count)
      })
    }
  })*/
})

app.get('/:bit([a-zA-Z0-9-_]{7,14}\~?\/?$)', function(req, res, next) {
  const bitid = req.params.bit
  const cleanid = bitid.replace(/\/$/, '')
  console.log(cleanid)
  // db.get(cleanedId, function (err, value) {
  //   if (err) {
  //     next()
  //   } else {
  //     const decryptedValue = key.decrypt(value, 'utf8')
  //     res.render('pages/bit', { bitId: cleanedId, bit: decryptedValue })
  //     if (!bitId.includes('~')) {
  //       db.del(cleanedId)
  //     }
  //   }
  // })
})

app.get('*', function(req, res) {
  const path = req.url
  const regex = new RegExp(/\/[a-zA-Z0-9-_]{7,14}\~?\/?$/)
  let error
  if (regex.test(path)) {
    error = 'The bit you have tried to access has already disappeared or was never created.'
  } else {
    error = 'The file you were looking for cannot be found.'
  }
  res.status(404).render('pages/error', { error: error })
})

app.listen(port, () => {
  console.log(`Listening on port ${port}`)
})
