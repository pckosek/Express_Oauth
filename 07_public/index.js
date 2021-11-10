#!/usr/bin/nodejs

// -------------- load packages -------------- //
var express = require('express')
var app = express();

var hbs = require('hbs');
app.set('view engine', 'hbs');


require('./config/config_sql.js')(app)
require('./config/config_cookie.js')(app)

// -------------- routes -------------- //

const home = require('./routes/home.js')
app.use(home);


const {oauth_router, checkAuthentication} = require('./routes/oauth.js')
app.use(oauth_router);



// -------------- listener -------------- //
// The listener is what keeps node 'alive.' 

var listener = app.listen(process.env.PORT || 8080, process.env.HOST || "0.0.0.0", function() {
    console.log("Express server started");
});
