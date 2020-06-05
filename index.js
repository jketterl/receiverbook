const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const session = require('express-session');
const config = require('./config');
const sessionMiddleware = require('./app/middleware/session');

const AppRouter = require('./app/routes');

require('./app/passport').setup().then((passport) => {
    const app = express();

    app.use(session({
        secret: config.session.secret,
        cookie: {},
        resave: true,
        saveUninitialized: true
    }));

    app.use(passport.initialize());

    app.use(sessionMiddleware);

    app.set('view engine', 'ejs');
    app.set('views', './views');
    app.use(expressLayouts);

    app.use('/', new AppRouter());

    app.listen(3000, () => console.info("Application started"));
});