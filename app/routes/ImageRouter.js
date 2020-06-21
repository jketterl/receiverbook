const express = require('express');
const ImageController = require('../controllers/ImageController');

class ImageRouter extends express.Router {
    constructor() {
        super();
        const imageController = new ImageController();
        this.get('/:id/avatar.png', imageController.avatar);
    }
}

module.exports = ImageRouter;