#!/usr/bin/nodejs

// -------------- load packages -------------- //
var cookieSession = require('cookie-session')
var express = require('express')
const {  AuthorizationCode } = require('simple-oauth2');
var app = express();

var https = require('https');
var hbs = require('hbs');

app.set('trust proxy', 1) // trust first proxy

// -------------- express initialization -------------- //

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

function checkAuthentication(req,res,next) {

    if ('authenticated' in req.session) {
        // the user has logged in
        next()
    }
    else {
        // the user has not logged in
        res.render('unverified', {'login_link' : authorizationUri})
    }
}

function getUserName(req,res,next) {
    var access_token = req.session.token.access_token;
    var profile_url = 'https://ion.tjhsst.edu/api/profile?format=json&access_token='+access_token;
    
    https.get(profile_url, function(response) {
    
      var rawData = '';
      response.on('data', function(chunk) {
          rawData += chunk;
      });
    
      response.on('end', function() {
        res.locals.profile = JSON.parse(rawData);
        next(); 
      });
    
    }).on('error', function(err) {
        next(err)
    });

}


app.get('/', [checkAuthentication, getUserName], function (req, res) {
    
        var profile = res.locals.profile;
        var first_name = profile.first_name;
        
        res.render('verified', {'user' : first_name});
});


app.get('/logout', function (req, res) {
    
    delete req.session.authenticated;
    res.redirect('https://user.tjhsst.edu/pckosek');

});


// -------------- intermediary login_worker helper -------------- //
async function convertCodeToToken(req, res, next) {
    var theCode = req.query.code;

    var options = {
        'code': theCode,
        'redirect_uri': ion_redirect_uri,
        'scope': 'read'
     };
    
    // needed to be in try/catch
    try {
        var accessToken = await client.getToken(options);      // await serializes asyncronous fcn call
        res.locals.token = accessToken.token;
        next()
    } 
    catch (error) {
        console.log('Access Token Error', error.message);
         res.send(502); // error creating token
    }
}


app.get('/login_worker', [convertCodeToToken], function(req, res) { 

    req.session.authenticated = true;
    req.session.token = res.locals.token;
    
    res.redirect('https://user.tjhsst.edu/pckosek');
    
});

// -------------- express listener -------------- //

// -------------- listener -------------- //
// // The listener is what keeps node 'alive.' 

var listener = app.listen(process.env.PORT || 8080, process.env.HOST || "0.0.0.0", function() {
    console.log("Express server started");
});
