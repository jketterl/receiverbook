function sessionMiddleware(req, res, next) {
    if (req.session && req.session.passport && req.session.passport.user) {
        res.locals.session = {
            username: req.session.passport.user.username
        }
    }
    next();
}

module.exports = sessionMiddleware