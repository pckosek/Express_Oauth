const express = require('express');
const router = express.Router();

const {  AuthorizationCode } = require('simple-oauth2');

const https = require('https');
    
var ion_client_id = 'UbHVu4OiHCtMI8pJUCh0NG1dNoX3VCm5CYd9dzmI';
var ion_client_secret = 'ylVjx8PJhSjtCl74BIUzHmqHHPbJK4tv803psudjjKQGztHBIejbV1ey9K0KfxVKmENaaSTDZ8E67SnjBvgFcY5ZGbIcAsnZXU0f0yRmSaUQYsmhdRIvTVXCZRaii2jX';
var ion_redirect_uri = 'https://user.tjhsst.edu/pckosek/login_worker';    //    <<== you choose this one

// Here we create an oauth2 variable that we will use to manage out OAUTH operations


var client = new AuthorizationCode({
  client: {
    id: ion_client_id,
    secret: ion_client_secret
  },
  auth: {
    tokenHost: 'https://ion.tjhsst.edu/oauth/',
    authorizePath: 'https://ion.tjhsst.edu/oauth/authorize',
    tokenPath: 'https://ion.tjhsst.edu/oauth/token/'
  }
});


const OAUTH_SCOPE = 'read';

var authorizationUri = client.authorizeURL({
    scope: OAUTH_SCOPE,
    redirect_uri: ion_redirect_uri
});


// console.log(authorizationUri)

function checkAuthentication(req,res,next) {

    res.locals.logged_in = false;
    if ('authenticated' in req.session) {
        // the user has logged in
        res.locals.logged_in = true;
    } else {
        res.locals.login_link = authorizationUri;
    }
    next()
}

async function possiblyRefreshToken(req,res,next) {

    if ('token' in req.session) {
        // console.log(req.session.token)
        var accessToken = client.createToken(req.session.token); //recreate a token (class) instance
        if (accessToken.expired()) {
            try {
                const refreshParams = {
                    'scope' : OAUTH_SCOPE,
                };
        
                req.session.token = await accessToken.refresh(refreshParams);
            } catch (error) {
                console.log('Error refreshing access token: ', error.message);
                return;
            }
        }
    }
    next();
}

function getProfile(req,res,next){
    
    console.log('getProfile')
    
    if ('authenticated' in req.session) {
        var sql = 'SELECT id, ion_username, display_name FROM users where id=?';
        var params = [req.session.id];
        res.app.locals.pool.query(sql, params, function(error, results, fields){
            // console.log(results)

            if (error) throw error;
            res.locals.ion_username = results[0].ion_username;
            res.locals.display_name = results[0].display_name;
            next(); 
        });
    } else {
        next();
    }
}


// -------------- express 'get' handlers -------------- //


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


router.get('/logout', function (req, res) {
    
    delete req.session.authenticated;
    res.redirect('https://mobiledev1.sites.tjhsst.edu/');

});


// -------------- intermediary login_worker helper -------------- //
async function convertCodeToToken(req, res, next) {
    
    console.log(req.query)
    var theCode = req.query.code;

    var options = {
        'code': theCode,
        'redirect_uri': ion_redirect_uri,
        'scope': OAUTH_SCOPE
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

function setAuthenticated(req,res,next) {
    req.session.authenticated = true;
    req.session.token = res.locals.token;
    next();
}


function retrieveIonId(req,res,next) {

    var access_token = req.session.token.access_token;
    var profile_url = 'https://ion.tjhsst.edu/api/profile?format=json&access_token='+access_token;
    
    https.get(profile_url, function(response) {
    
      var rawData = '';
      response.on('data', function(chunk) {
          rawData += chunk;
      });
    
      response.on('end', function() {
        var profile = JSON.parse(rawData);

        var id, ion_username, display_name, user_type, admin;
        ({id, ion_username, display_name, user_type} = profile);

        admin = false;
        if (user_type=='teacher'){
            admin = true;
        }

        req.session.id = id;
        
        var sql    = 'INSERT INTO users (id, ion_username, display_name, admin) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE id=id;';
        var params = [id, ion_username, display_name, admin];
        res.app.locals.pool.query(sql, params, function(error, results, fields){
            if (error) throw error;
            next(); 
        });
      });
    
    }).on('error', function(err) {
        next(err)
    });

}

router.get('/login_worker',[convertCodeToToken,setAuthenticated, retrieveIonId], function(req, res) { 
    
    console.log(req.session.token)
    res.redirect('./');
    
});

module.exports.oauth_router = router;
module.exports.checkAuthentication = [checkAuthentication, possiblyRefreshToken, getProfile];
