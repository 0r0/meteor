// Cordova specific code for the OAuth package.

// Open a popup window, centered on the screen, and call a callback when it
// closes.
//
// @param url {String} url to show
// @param callback {Function} Callback function to call on completion. Takes no
//   arguments.
// @param dimensions {optional Object(width, height)} The dimensions of
//   the popup. If not passed defaults to something sane.
OAuth.showPopup = function (url, callback, dimensions) {
  var fail = function (err) {
    Meteor._debug("Error from OAuth popup:", err);
  };

  var pageLoaded = function (event) {
    if (event.url.indexOf(Meteor.absoluteUrl('_oauth')) === 0 &&
        // Do not close the popup during the initial OAuth1 request.
        event.url.indexOf("requestTokenAndRedirect=true") === -1) {
      var splitUrl = event.url.split("#");
      var hashFragment = splitUrl[1];

      if (! hashFragment) {
        throw new Error("No hash fragment in OAuth popup?");
      }

      var credentials = JSON.parse(decodeURIComponent(hashFragment));
      OAuth._handleCredentialSecret(credentials.credentialToken,
                                    credentials.credentialSecret);

      // On iOS, this seems to prevent "Warning: Attempt to dismiss from
      // view controller <MainViewController: ...> while a presentation
      // or dismiss is in progress". My guess is that the last
      // navigation of the OAuth popup is still in progress while we try
      // to close the popup. See
      // https://issues.apache.org/jira/browse/CB-2285.
      //
      // XXX Can we make this timeout smaller?
      setTimeout(function () {
        popup.close();
        callback();
      }, 100);
    }
  };

  var onExit = function () {
    popup.removeEventListener('loadstop', pageLoaded);
    popup.removeEventListener('loaderror', fail);
    popup.removeEventListener('exit', onExit);
  };

  var popup = window.open(url, '_blank', 'location=yes,hidden=yes');
  popup.addEventListener('loadstop', pageLoaded);
  popup.addEventListener('loaderror', fail);
  popup.addEventListener('exit', onExit);
  popup.show();

};
