#!/usr/bin/nodejs

// -------------- load packages -------------- //
var cookieSession = require('cookie-session')
var express = require('express')
const {  AuthorizationCode } = require('simple-oauth2');
var app = express();

var hbs = require('hbs');

app.set('trust proxy', 1) // trust first proxy

// -------------- express initialization -------------- //

// Here, we set the port (these settings are specific to our site)
app.set('port', process.env.PORT || 8080 );
app.set('view engine', 'hbs');

app.use(cookieSession({
  name: 'snorkles',
  keys: ['SomeSecretKeys123', 'ThatYouShouldChange456']
}))


// -------------- variable initialization -------------- //

// These are parameters provided by the authenticating server when
// we register our OAUTH client.
// -- The client ID is going to be public
// -- The client secret is super top secret. Don't make this visible
// -- The redirect uri should be some intermediary 'get' request that 
//     you write in whichyou assign the token to the session.

//  YOU GET THESE PARAMETERS BY REGISTERING AN APP HERE: https://ion.tjhsst.edu/oauth/applications/    

var ion_client_id = 'UbHVu4OiHCtMI8pJUCh0NG1dNoX3VCm5CYd9dzmI';
var ion_client_secret = 'ylVjx8PJhSjtCl74BIUzHmqHHPbJK4tv803psudjjKQGztHBIejbV1ey9K0KfxVKmENaaSTDZ8E67SnjBvgFcY5ZGbIcAsnZXU0f0yRmSaUQYsmhdRIvTVXCZRaii2jX';
var ion_redirect_uri = 'https://user.tjhsst.edu/pckosek/login_worker';    //    <<== you choose this one

// Here we create an oauth2 variable that we will use to manage out OAUTH operations

var client = new AuthorizationCode({
  client: {
    id: ion_client_id,
    secret: ion_client_secret,
  },
  auth: {
    tokenHost: 'https://ion.tjhsst.edu/oauth/',
    authorizePath: 'https://ion.tjhsst.edu/oauth/authorize',
    tokenPath: 'https://ion.tjhsst.edu/oauth/token/'
  }
});

// This is the link that will be used later on for logging in. This URL takes
// you to the ION server and asks if you are willing to give read permission to ION.

var authorizationUri = client.authorizeURL({
    scope: "read",
    redirect_uri: ion_redirect_uri
});

console.log(authorizationUri)

// -------------- express 'get' handlers -------------- //

app.get('/', function (req, res) {
    
    res.render('unverified', {'login_link' : authorizationUri})

});


// -------------- intermediary login_worker helper -------------- //


app.get('/login_worker', function(req, res) { 

    res.write('foo');
    res.end();
});

// -------------- express listener -------------- //

var listener = app.listen(app.get('port'), function() {
  console.log( 'Express server started on port: '+listener.address().port );
});
