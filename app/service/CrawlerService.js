const mongoose = require('mongoose');
const ReceiverService = require('./ReceiverService');
const Receiver = require('../models/Receiver');

class CrawlerService {
    constructor() {
        // 60 minute interval
        this.interval = 60 * 60 * 1000;
    }
    run() {
        this.schedule();
    }
    schedule(delay=0) {
        setTimeout(() => {
            const startTime = new Date().getTime()
            this.collectAll().finally( () => {
                const now = new Date().getTime()
                this.schedule(Math.max(0, startTime + this.interval - now))
            })
        }, delay);
    }
    async collectAll() {
        console.info('now updating all receivers...');
        const receivers = await Receiver.find({})
        const receiverService = new ReceiverService();
        for (const receiver of receivers) {
            try {
                await receiverService.updateReceiver(receiver);
            } catch (err) {
                console.error(`error while updating ${receiver.label}`, err)
            }
        }
        console.info('update complete.')
    }
}

module.exports = CrawlerService;