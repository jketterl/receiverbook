function authenticatedUser(req, res, next) {
    if (req.session && req.session.passport && req.session.passport.user) {
        req.user = req.session.passport.user.username;
        return next();
    }
    return next(new Error('User not authenticated'));
}

module.exports = {
    authenticatedUser: authenticatedUser
};