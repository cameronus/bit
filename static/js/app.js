$(function() {
  var form = $('#form');
  $("form").submit(function(event) {
    event.preventDefault();
    var formData = $(form).serialize();
    $.ajax({
      type: 'POST',
      url: $(form).attr('action'),
      data: formData
    }).done(function(response) {
      swal({title: "<h1 class='mainTitle'>Bit created!</h1>",
            html: "<p class='regularText'>"
            +     "Click on this link to copy to clipboard <br>"
            +     "(not supported in Safari): <br>"
            +     "<b><textarea id='selectLink' type='text' onclick='this.focus(); this.select(); document.execCommand(\"copy\")' readonly='readonly'>"
            +     response
            +     "</textarea></b><br/>"
            +     "<img id='qr' src='https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=" + response + "' onclick='window.print()' />"
            +      "</p>",
            type: "success"});
      $('#text').val('');
      $('#permanent').attr('checked', false);
    }).fail(function(data) {
      if (data.responseText !== '') {
        swal({title: "<h1 class='mainTitle'>Error!</h1>", text: "<p class='regularText'>" + data.responseText + "</p>", type: "error" });
      } else if (data.status === 400) {
        swal({title: "<h1 class='mainTitle'>Error!</h1>", text: "<p class='regularText'>Don't screw with me!</p>", type: "error", closeOnConfirm: false, allowOutsideClick: false, allowEscapeKey: false, confirmButtonText: "Reload", timer: 1500})
        .then(function() {
          location.reload();
        });
      } else {
        swal({title: "<h1 class='mainTitle'>Error!</h1>", text: "<p class='regularText'>A network error has occurred!</p>", type: "error" });
      }
    });
  });
});
