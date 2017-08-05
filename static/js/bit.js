$(document).ready(() => {
  if (window.bitPermanent && !window.bitEncrypted) viewBit('')
  if (window.bitEncrypted) {
    $('#create').html('DECRYPT')
    $('#bitWarning').html('Please enter your key to decrypt the bit.')
    $('#bitKey').show()
  }
})

function prepareBit() {
  let key = $('#bitKey').val()
  if (window.bitEncrypted) {
    if (key == '') return error('Please enter your decryption key.')
    const bcrypt = dcodeIO.bcrypt
    bcrypt.hash(key, window.bitSalt, (err, hash) => {
      if (err) error('Hashing error, invalid decryption key.')
      viewBit(hash)
    })
  } else {
    viewBit('')
  }
}

function viewBit(key) {
  $.ajax({
    type: 'POST',
    url: '/' + window.bitid,
    data: {
      hashedKey: key
    }
  }).done((response) => {
    $('#bitError').html()
    if (window.bitEncrypted) {
      //decrypt
    }
    $('#bit').html(response)
    $('#viewBit').hide()
    $('#bitContent').show()
  }).fail((data) => {
    if (data.status == 500) return error('Internal server error, try again later.')
    error(data.responseText)
  })
}

function error(message) {
  $('#bitError').html('<p>' + message + '</p>')
}
