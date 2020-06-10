const mongoose = require('mongoose');
const ReceiverService = require('./ReceiverService');

class CrawlerService {
    constructor() {
        // 60 minute interval
        this.interval = 60 * 60 * 1000;
    }
    run() {
        this.schedule();
    }
    schedule(when) {
        const now = new Date().getTime();
        let remaining = 0;
        if (when) {
            remaining = when - now;
        }
        setTimeout(() => {
            this.collectAll().finally( () => {
                this.schedule(now + this.interval)
            })
        }, remaining);
    }
    async collectAll() {
        console.info('now updating all receivers...');
        const Receiver = mongoose.model('Receiver');
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