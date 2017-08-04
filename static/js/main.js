/*$(document).ready(() => {
  const wrapper = $('.bitWrapper').height()
  const viewport = $(window).height()
  if (wrapper > viewport) {
    $('#footer').addClass('kill')
  }
})

function createEncryptedBit() {
  swal({
    title: 'Enter key to encrypt bit',
    input: 'text',
    confirmButtonText: 'Encrypt',
  }).then((key) => {
    createBit(key)
  })
}

function createBit(key) {
  $.ajax({
    type: 'POST',
    url: '/',
    data: {
      text: $('#text').val(),
      key: key,
      encrypted: key !== undefined,
      permanent: $('#permanent').is(':checked'),
      hidden: $('#hidden').val()
    }
  }).done((response) => {
    swal({
      title: 'Bit created!',
      html: '<div id="swalExtraInfo">'
      +        'Click on the link below to copy to clipboard: <br>'
      +       '</div>'
      +       '<b><textarea id="selectLink" type="text" onclick="this.focus();this.select();document.execCommand(\'copy\')" readonly="readonly">'
      +         response
      +       '</textarea></b><br/>'
      +       '<div id="qrDiv">'
      +         '<img id="qr" src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=' + response + '" onclick="window.print()" />'
      +       '</div>',
      type: 'success'
    })
    $('#text').val('')
    $('#permanent').prop('checked', false)
    console.log('done');
  }).fail(function(data) {
    error(data.responseJSON.message, data.responseJSON.reload)
  })
}

function error(errorText, reload) {
  if (reload) {
    swal({title: 'Error!',
          text: errorText,
          type: 'error',
          closeOnConfirm: false,
          allowOutsideClick: false,
          allowEscapeKey: false,
          confirmButtonText: 'Reload',
          timer: 4000})
    .then(function() {
      location.reload()
    })
  } else {
    swal({title: 'Error!',
          text: errorText,
          type: 'error' })
  }
}*/

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
  $('#text').val('')
  $('#key').val('')
  $('#permanent').prop('checked', false)
  $('#bitError').html('')
}

function createBit() {
  $('#bitError').html('')

  const rawtext = $('#text').val()
  const key = $('#key').val()

  if (rawtext.length == 0) return error('Your bit must be at least one character.')
  if (window.bitEncrypted && key.length == 0) return error('Your encryption key must be at least one character.')

  const md = window.markdownit()
  const processed = md.render(rawtext)

  let hashedKey = key

  if (window.bitEncrypted) {
    $('#bitLoader').show()
    $('#overlay').show()

    const bcrypt = dcodeIO.bcrypt
    hashedKey = bcrypt.hashSync(key, 10)
    triplesec.encrypt({
      data: new triplesec.Buffer(processed),
      key: new triplesec.Buffer(key),
      progress_hook: (obj) => {}
    }, (err, buff) => {
      if (err) return error('Encryption error, please try again later.')
      sendBit(buff.toString('hex'))
    })
  } else {
    sendBit(processed)
  }
}

function sendBit(text, hashedKey) {
  if (text.length > 10000) return error('Your bit is too long.')

  $('#bitLoader').hide()
  $('#overlay').hide()
  return console.dir({
    text: text,
    hashedKey: hashedKey,
    encrypted: window.bitEncrypted,
    permanent: $('#permanent').is(':checked'),
    hidden: $('#hidden').val()
  })

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
    // swal({
    //   title: 'Bit created!',
    //   html: '<div id="swalExtraInfo">'
    //   +        'Click on the link below to copy to clipboard: <br>'
    //   +       '</div>'
    //   +       '<b><textarea id="selectLink" type="text" onclick="this.focus();this.select();document.execCommand(\'copy\')" readonly="readonly">'
    //   +         response
    //   +       '</textarea></b><br/>'
    //   +       '<div id="qrDiv">'
    //   +         '<img id="qr" src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=' + response + '" onclick="window.print()" />'
    //   +       '</div>',
    //   type: 'success'
    // })
    $('#text').val('')
    $('#key').val('')
    $('#permanent').prop('checked', false)
    $('#bitLoader').hide()
    $('#overlay').hide()
    console.log(response)
    alert(response)
  }).fail((data) => {
    error(data)
  })
}

function error(message) {
  $('#bitLoader').hide()
  $('#overlay').hide()
  $('#bitError').html('<p>' + message + '</p>')
}
