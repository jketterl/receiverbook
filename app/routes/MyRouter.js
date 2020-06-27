const express = require('express');
const ReceiverController = require('../controllers/my/ReceiverController');
const StationController = require('../controllers/my/StationController');
const authenticatedUser = require('../middleware/authenticated').authenticatedUser

class MyRouter extends express.Router {
    constructor() {
        super()
        this.use(authenticatedUser);
        const receiverController = new ReceiverController();
        this.get('/receivers', receiverController.index);
        this.get('/receivers/new', receiverController.newReceiver);
        this.post('/receivers/new', receiverController.processNewReceiver);
        this.get('/receivers/:id', receiverController.editReceiver);
        this.get('/receivers/:id/delete', receiverController.deleteReceiver);
        this.get('/receivers/:id/regenerate_key', receiverController.regenerateKey);
        const stationController = new StationController();
        this.get('/stations', stationController.index);
        this.get('/stations/new', stationController.newStation);
        this.post('/stations/new', stationController.processNewStation);
        this.get('/stations/:id', stationController.editStation);
        this.get('/stations/:id/delete', stationController.deleteStation);
        this.post('/stations/:id/assignReceiver', stationController.assignReceiver);
        this.get('/stations/:id/removeReceiver/:receiver_id', stationController.removeReceiver);
    }
}

module.exports = MyRouter;