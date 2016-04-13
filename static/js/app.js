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
      // Make sure that the formMessages div has the 'success' class.
      /*$(formMessages).removeClass('error');
      $(formMessages).addClass('success');

      // Set the message text.
      $(formMessages).text(response);*/
      swal({title: "Shot created!",
        text: "The link might go here in the future, but you typed in: " + response,
        type: "success" });

      // Clear the form.
      $('#text').val('');
    }).fail(function(data) {
      if (data.responseText !== '') {
        swal({title: "Error!",
          text: "data.responseText",
          type: "error" });
      } else {
        swal({title: "Error!",
          text: "Oops! An error occured and your message could not be sent.",
          type: "error" });
      }
    });
  });
});
