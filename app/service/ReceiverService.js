const OpenWebRxAdapter = require('./adapters/OpenWebRxAdapter');
const WebSdrAdapter = require('./adapters/WebSdrAdapter');
const KiwiSdrAdapter = require('./adapters/KiwiSdrAdapter');
const mongoose = require('mongoose');

class ReceiverService {
    constructor(){
        this.detectors = {
            'openwebrx': OpenWebRxAdapter,
            'websdr': WebSdrAdapter,
            'kiwisdr': KiwiSdrAdapter
        }
    }
    async getPublicReceivers() {
        const Receiver = mongoose.model('Receiver');
        return await Receiver.find({status: 'online'})
    }
    async detectReceiverType(url) {
        const resultArray = await Promise.all(
            Object.entries(this.detectors).map(async ([type, detectorCls]) => {
                const detector = new detectorCls();
                return [type, await detector.matches(url)];
            })
        );
        const matches = resultArray.filter(e => e[1])
        if (!matches.length) return false;
        const firstResult = matches[0][1]
        firstResult.type = matches[0][0]
        return firstResult
    }
    async updateReceiver(receiver) {
        const detectorCls = this.detectors[receiver.type];
        const detector = new detectorCls();
        await detector.updateReceiver(receiver);
    }
}

module.exports = ReceiverService;