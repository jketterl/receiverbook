const OpenWebRxAdapter = require('./adapters/OpenWebRxAdapter');
const WebSdrAdapter = require('./adapters/WebSdrAdapter');
const KiwiSdrAdapter = require('./adapters/KiwiSdrAdapter');
const mongoose = require('mongoose');
const BandService = require('./BandService');

class ReceiverService {
    constructor(){
        this.adapters = {
            'openwebrx': OpenWebRxAdapter,
            'websdr': WebSdrAdapter,
            'kiwisdr': KiwiSdrAdapter
        }
    }
    async getPublicReceivers() {
        const Receiver = mongoose.model('Receiver');
        const receivers = await Receiver.find({status: 'online'})
        return receivers.map(receiver => {
            const r = receiver.toObject();
            r.type = this.getPresentationType(receiver);
            r.bands = this.getPresentationBands(receiver);
            return r
        });
    }
    getPresentationType(receiver) {
        switch (receiver.type) {
            case 'openwebrx':
                return 'OpenWebRX';
            case 'websdr':
                return 'WebSDR';
            case 'kiwisdr':
                return 'KiwiSDR';
        }
        return 'Other';
    }
    async detectReceiverType(url) {
        const resultArray = await Promise.all(
            Object.entries(this.adapters).map(async ([type, detectorCls]) => {
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
    getAdapter(receiver) {
        const adatperCls = this.adapters[receiver.type];
        return new adatperCls();
    }
    async updateReceiver(receiver) {
        await this.getAdapter(receiver).updateReceiver(receiver);
    }
    getPresentationBands(receiver) {
        const bandService = new BandService();
        return bandService.getMatchingBands(receiver.bands).map(b => b.name);
    }
    applyCrawlingResult(receiver, result) {
        return this.getAdapter(receiver).applyCrawlingResult(receiver, result);
    }
}

module.exports = ReceiverService;