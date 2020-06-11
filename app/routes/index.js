const express = require('express');
const SessionRouter = require('./SessionRouter');
const IndexController = require('../controllers/IndexController');
const MyRouter = require('./MyRouter');

class AppRouter extends express.Router {
    constructor() {
        super();
        const indexController = new IndexController();
        this.get('/', indexController.index);
        this.get('/impressum', indexController.impressum);
        this.use('/session', new SessionRouter());
        this.use('/my', new MyRouter());
        this.use('/static', express.static('assets'));
        this.use('/static/mdi', express.static('node_modules/@mdi/font'));
    }
}

module.exports = AppRouter;