function HTMLProCallback()
{

}
function login()
{
    AuthClient.login($('#username').val(), $('#password').val())
    .then(allowedApps => {
      console.log('Login OK, app permesse:', allowedApps);
      window.location.href = 'http://app.fixor.localhost/';
    })
    .catch(err => alert('Errore login: ' + err.responseJSON?.message));
}