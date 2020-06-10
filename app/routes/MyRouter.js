const express = require('express');
const MyController = require('../controllers/MyController');
const authenticatedUser = require('../middleware/authenticated').authenticatedUser

class MyRouter extends express.Router {
    constructor() {
        super()
        this.use(authenticatedUser);
        const controller = new MyController();
        this.get('/receivers', controller.receivers);
        this.get('/receivers/new', controller.newReceiver);
        this.post('/receivers/new', controller.processNewReceiver);
        this.get('/receivers/:id', controller.editReceiver);
        this.get('/receivers/:id/delete', controller.deleteReceiver);
        this.get('/receivers/:id/regenerate_key', controller.regenerateKey);
    }
}

module.exports = MyRouter;