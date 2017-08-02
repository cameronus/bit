$(function() {
  var form = $('#form')
  $(form).submit(function(event) {
    event.preventDefault()
    var formData = $(form).serialize()
    $.ajax({
      type: 'POST',
      url: $(form).attr('action'),
      data: formData
    }).done(function(response) {
      swal({title: "<h1 class='mainTitle'>Bit created!</h1>",
            html: "<p class='regularText'>"
            +       "<div id='swalExtraInfo'>"
            +        "Click on the link below to copy to clipboard: <br>"
            +       "</div>"
            +       "<b><textarea id='selectLink' type='text' onclick='this.focus() this.select() document.execCommand(\"copy\")' readonly='readonly'>"
            +         response
            +       "</textarea></b><br/>"
            +       "<div id='qrDiv'>"
            +         "<img id='qr' src='https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=" + response + "' onclick='window.print()' />"
            +       "</div>"
            +     "</p>",
            type: "success"})
      $('#text').val('')
      $('#permanent').attr('checked', false)
    }).fail(function(data) {
      error(data.responseText.message, data.responseText.reload)
    })
  })

  var wrapper = $('.bitWrapper').height()
  var viewport = $(window).height()
  if (wrapper > viewport) {
    $('#footer').addClass('kill')
  }
})

function error(errorText, reload) {
  if (reload) {
    swal({title: "<h1 class='mainTitle'>Error!</h1>",
          text: "<p class='regularText'>" + errorText + "</p>",
          type: "error",
          closeOnConfirm: false,
          allowOutsideClick: false,
          allowEscapeKey: false,
          confirmButtonText: "Reload",
          timer: 4000})
    .then(function() {
      location.reload()
    })
  } else {
    swal({title: "<h1 class='mainTitle'>Error!</h1>",
          text: "<p class='regularText'>" + errorText + "</p>",
          type: "error" })
  }
}
