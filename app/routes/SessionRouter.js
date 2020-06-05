const express = require('express');
const SessionController = require('../controllers/SessionController');

class SessionRouter extends express.Router {
    constructor() {
        super();
        const controller = new SessionController();
        this.get('/login', controller.login);
        this.get('/receiveLogin', controller.receiveLogin, controller.loginComplete);
    }
}

module.exports = SessionRouter;