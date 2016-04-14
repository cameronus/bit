$(function() {
  // Get the form.
  var form = $('#form');

  // Get the messages div.
  var formMessages = $('#form-messages');

  $("form").submit(function(event) {
    event.preventDefault();
    var formData = $(form).serialize();

    $.ajax({
      type: 'POST',
      url: $(form).attr('action'),
      data: formData
    }).done(function(response) {
      swal({title: "Bit created!",
        text: "Your link is <a href='" + response + "'><b>here</b></a> or you may click and copy it from here: <b><textarea id='selectLink' type='text' onclick='this.focus(); this.select()' readonly='readonly'>" + response + "</textarea></b>",
        type: "success",
        html: true });
      $('#text').val('');

    }).fail(function(data) {
      if (data.responseText !== '') {
        swal({title: "Error!",
          text: data.responseText,
          type: "error" });
      } else if (data.status === 400) {
        swal({title: "Error!",
          text: "Don't screw with me!",
          type: "error",
          closeOnConfirm: false },
        function() {
          location.reload();
        });
      } else {
        swal({title: "Error!",
          text: "Oops! A network error occured and your message could not be sent.",
          type: "error" });
      }
    });
  });
});
