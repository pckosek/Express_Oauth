const express = require('express');
const router = express.Router()

const {checkAuthentication} = require('/site/public2/routes/oauth.js')

router.get('/', checkAuthentication, function(req,res){
  
  if (res.locals.logged_in) {
    res.render('verified', res.locals)
  } else {
      res.render('unverified', res.locals)
  }
})

module.exports = router;
