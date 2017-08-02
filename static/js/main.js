$(document).ready(() => {
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
    preConfirm: (key) => {
      return new Promise((resolve, reject) => {
        if (key.trim() == '') {
          reject('Please enter a key to continue.')
        } else {
          resolve()
        }
      })
    },
  }).then((password) => {
    if (password.trim() == '') {
      createBit($('#text').val())
    } else {
      triplesec.encrypt({
        data: new triplesec.Buffer($('#text').val()),
        key: new triplesec.Buffer(password),
        progress_hook: (obj) => {}
      }, (err, buff) => {
        if (!err) {
          const ciphertext = buff.toString('hex')
          createBit(ciphertext)
        }
      })
    }
  })
}

function createBit(text) {
  $.ajax({
    type: 'POST',
    url: '/',
    data: {
      text: text,
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
    $('#permanent').attr('checked', false)
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
}
