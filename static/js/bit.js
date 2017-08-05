if (window.bitPermanent && !window.bitEncrypted) viewBit('')
if (window.bitEncrypted) {
  $('#create').html('DECRYPT')
  $('#bitWarning').html('Please enter your key to decrypt the bit.')
  $('#bitKey').show()
}

function prepareBit() {
  let key = $('#bitKey').val()
  if (window.bitEncrypted) {
    if (key == '') return error('Please enter your decryption key.')
    const bcrypt = dcodeIO.bcrypt
    bcrypt.hash(key, window.bitSalt, (err, hash) => {
      if (err) return error('Hashing error, invalid decryption key.')
      viewBit(key, hash)
    })
  } else {
    viewBit('', '')
  }
}

function viewBit(key, hashedKey) {
  $.ajax({
    type: 'POST',
    url: '/' + window.bitid,
    data: {
      hashedKey: hashedKey
    }
  }).done((response) => {
    $('#bitError').html()
    if (window.bitEncrypted) {
      triplesec.decrypt ({
        data: new triplesec.Buffer(response, 'hex'),
        key: new triplesec.Buffer(key),
        progress_hook: (obj) => {}
      }, (err, buff) => {
        if (err) return error('Decryption error, malformed data.')
        $('#bit').html(buff.toString())
        $('#viewBit').hide()
        $('#bitContent').show()
      })
    } else {
      $('#bit').html(response)
      $('#viewBit').hide()
      $('#bitContent').show()
    }
  }).fail((data) => {
    if (data.status == 500) return error('Internal server error, try again later.')
    error(data.responseText)
  })
}

function error(message) {
  $('#bitError').html('<p>' + message + '</p>')
}
