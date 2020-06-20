const bands = require('../../config/bands.json');

class BandService {
    getMatchingBands(receiverBands) {
        const receiverRanges = receiverBands.map(rb => rb.asRange());
        return bands.filter(band => {
            return receiverRanges.some(rb => {
                return rb.start <= band.upper_bound && rb.end >= band.lower_bound;
            });
        });
    }
}

module.exports = BandService