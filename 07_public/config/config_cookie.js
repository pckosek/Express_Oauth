var cookieSession = require('cookie-session')

module.exports = function(app) {
    app.set('trust proxy', 1) // trust first proxy
    
    app.use(cookieSession({
      name: 'snorkles',
      keys: ['SomeSecretKeys123', 'ThatYouShouldChange456']
    }))
}