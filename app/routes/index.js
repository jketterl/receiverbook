const express = require('express');
const SessionRouter = require('./SessionRouter');
const IndexController = require('../controllers/IndexController');
const MapController = require('../controllers/MapController');
const ReceiverController = require('../controllers/ReceiverController');
const MyRouter = require('./MyRouter');
const compression = require('compression');
const ImageRouter = require('./ImageRouter');
const authenticationAware = require('../middleware/authenticated').authenticationAware

class AppRouter extends express.Router {
    constructor() {
        super();
        const indexController = new IndexController();
        this.get('/', indexController.index);
        this.get('/impressum', indexController.impressum);
        const mapController = new MapController();
        this.get('/map', mapController.index);
        this.get('/robots.txt', (req, res) => {
            res.type('text/plain');
            res.send('User-Agent: *\nDisallow:');
        });

        const receiverController = new ReceiverController();
        this.get('/receivers/new', receiverController.newReceiver);
        this.post('/receivers/new', authenticationAware, receiverController.processNewReceiver);
        this.get('/receivers/addedsuccessfully', receiverController.addedSuccessfully);

        this.use('/session', new SessionRouter());
        this.use('/my', new MyRouter());
        this.use('/images', new ImageRouter());
        const staticOptions = {
           maxAge: 3600000
        };
        this.use('/static', compression(), express.static('assets', staticOptions));
        this.use('/static/mdi', compression(), express.static('node_modules/@mdi/font', staticOptions));
        this.use('/static/jquery', compression(), express.static('node_modules/jquery/dist', staticOptions));
        this.use('/static/popper', compression(), express.static('node_modules/popper.js/dist/umd', staticOptions));
        this.use('/static/bootstrap', compression(), express.static('node_modules/bootstrap/dist', staticOptions));
    }
}

module.exports = AppRouter;