const passport = require('passport');

class SessionController {
    constructor() {
        this.login = passport.authenticate('oauth2');
        this.receiveLogin = passport.authenticate('oauth2', {
            scope: ['email', 'openid', 'aws.cognito.signin.user.admin', 'profile'],
            failureRedirect: '/session/failure'
        });
    }
    loginComplete(req, res) {
        res.redirect('/');
    }
}

module.exports = SessionController;