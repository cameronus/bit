$(function() {
  var form = $('#form');
  $("form").submit(function(event) {
    event.preventDefault();
    var formData = $(form).serialize();
    formData += '\x7E';
    $.ajax({
      type: 'POST',
      url: $(form).attr('action'),
      data: formData
    }).done(function(response) {
      swal({title: "<h1 class='mainTitle'>Bit created!</h1>",
            html: "<p class='regularText'>"
            +       "<div id='swalExtraInfo'>"
            +        "Click on this link to copy to clipboard <br>"
            +        "(not supported in Safari): <br>"
            +       "</div>"
            +       "<b><textarea id='selectLink' type='text' onclick='this.focus(); this.select(); document.execCommand(\"copy\")' readonly='readonly'>"
            +         response
            +       "</textarea></b><br/>"
            +       "<div id='qrDiv'>"
            +         "<img id='qr' src='https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=" + response + "' onclick='window.print()' />"
            +       "</div>"
            +     "</p>",
            type: "success"});
      $('#text').val('');
      $('#permanent').attr('checked', false);
    }).fail(function(data) {
      if (data.responseText !== '') {
        swal({title: "<h1 class='mainTitle'>Error!</h1>", text: "<p class='regularText'>" + data.responseText + "</p>", type: "error" });
      } else if (data.status === 400) {
        swal({title: "<h1 class='mainTitle'>Error!</h1>", text: "<p class='regularText'>A server error has occured. Please reload.</p>", type: "error", closeOnConfirm: false, allowOutsideClick: false, allowEscapeKey: false, confirmButtonText: "Reload", timer: 1500})
        .then(function() {
          location.reload();
        });
      } else {
        swal({title: "<h1 class='mainTitle'>Error!</h1>", text: "<p class='regularText'>A network error has occurred.</p>", type: "error" });
      }
    });
  });
  var wrapper = $('.bitWrapper').height();
  var viewport = $(window).height();
  if (wrapper > viewport) {
    $('#footer').addClass('kill');
  }
});
