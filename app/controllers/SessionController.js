const passport = require('passport');

class SessionController {
    constructor() {
        this.login = passport.authenticate('oauth2');
        this.receiveLogin = passport.authenticate('oauth2', {
            scope: ['email', 'openid', 'aws.cognito.signin.user.admin', 'profile'],
            failureRedirect: '/session/failure'
        });
    }
    async loginComplete(req, res) {
        await req.session.save();
        res.redirect('/');
    }
    async logout(req, res) {
        req.logout();
        await req.session.save();
        res.redirect('/');
    }
}

module.exports = SessionController;