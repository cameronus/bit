'use strict'

function show(showKey) {
  window.bitEncrypted = showKey
  $('.title, .buttons').hide()
  $('.bit-creation, .key').show()
  if (!showKey) {
    $('.key').hide()
  }
  $('#text').focus()
}

function goBack() {
  $('.title, .buttons').show()
  $('.bit-creation').hide()
  $('.bit-success').hide()
  $('#text').val('')
  $('#key').val('')
  $('#permanent').prop('checked', false)
  $('#bitError').html('')
}

function createBit() {
  $('#bitError').html('')

  const rawtext = $('#text').val().trim()
  const key = $('#key').val()

  if (rawtext.length == 0) return error('Your bit must be at least one character.')
  if (window.bitEncrypted && key.length == 0) return error('Your encryption key must be at least one character.')
  if (window.bitEncrypted && key.length > 16) return error('Your encryption key must be less than or equal to 72 characters.')

  const md = window.markdownit()
  const processed = md.render(rawtext)

  let hashedKey = key

  if (window.bitEncrypted) {
    $('#bitLoader').show()
    $('#overlay').show()

    const bcrypt = dcodeIO.bcrypt
    bcrypt.hash(key, 10, (err, hashedKey) => {
      triplesec.encrypt({
        data: new triplesec.Buffer(processed),
        key: new triplesec.Buffer(key),
        progress_hook: (obj) => {}
      }, (err, buff) => {
        if (err) return error('Encryption error, please try again later.')
        sendBit(buff.toString('hex'), hashedKey)
      })
    })
  } else {
    sendBit(processed, '')
  }
}

function sendBit(text, hashedKey) {
  if (text.length > 10000) return error('Your bit is too long.')

  $('#bitLoader').hide()
  $('#overlay').hide()

  $.ajax({
    type: 'POST',
    url: '/',
    data: {
      text: text,
      hashedKey: hashedKey,
      encrypted: window.bitEncrypted,
      permanent: $('#permanent').is(':checked'),
      hidden: $('#hidden').val()
    }
  }).done((response) => {
    $('#text').val('')
    $('#key').val('')
    $('#permanent').prop('checked', false)
    $('#bitLoader').hide()
    $('#overlay').hide()
    $('.bit-creation').hide()
    $('#bitLink').val(response)
    $('#bitQr').attr('src', 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=' + response)
    $('#qrLink').show()
    $('#bitQr').hide()
    $('.bit-success').show()
  }).fail((data) => {
    if (data.status == 500) return error('Internal server error, try again later.')
    error(data.responseText)
  })
}

function error(message) {
  $('#bitLoader').hide()
  $('#overlay').hide()
  $('#bitError').html('<p>' + message + '</p>')
}

function viewQr() {
  $('#qrLink').hide()
  $('#bitQr').show()
}
