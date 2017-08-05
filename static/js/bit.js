$(document).ready(() => {
  if (window.bitEncrypted) $('#bitKey').show()
})

function viewBit() {
  let key = $('#bitKey').val()
  if (window.bitEncrypted) {
    const bcrypt = dcodeIO.bcrypt
    bcrypt.hash(key, 10, (err, hash) => {
      if (err) ;//err
      key = hash
    })
  }
  $.ajax({
    type: 'POST',
    url: '/' + window.bitid,
    data: {
      hashedKey: key
    }
  }).done((response) => {
    if (window.bitEncrypted) {
      //decrypt
    }
    alert(response)
  }).fail((data) => {
    // if (data.status == 500) return error('Internal server error, try again later.')
    // error(data.responseText)
    alert(data.responseText)
  })
}
