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
}
