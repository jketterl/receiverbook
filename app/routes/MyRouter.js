const express = require('express');
const MyController = require('../controllers/MyController');
const authenticatedUser = require('../middleware/authenticated').authenticatedUser

class MyRouter extends express.Router {
    constructor() {
        super()
        this.use(authenticatedUser);
        const controller = new MyController();
        this.get('/receivers', controller.receivers);
    }
}

module.exports = MyRouter;