const bandPlan = require('../../config/bands.json');

class BandService {
    constructor() {
        this.bands = bandPlan;
        this.bands.forEach((band, index) => {
            band.id = this.toId(band.name);
        });
        this.tags = {
            "hamradio": "HAM radio",
            "broadcast": "Broadcast services",
            "public": "Public two-way radio"
        };
    }
    toId(name) {
        return Array.from(name.toLowerCase()).filter((c) => {
            const code = c.charCodeAt(0);
            return ((code > 96 && code <= 122) || (code > 47 && code <= 57));
        }).join('');
    }
    getMatchingBands(receiverBands) {
        const receiverRanges = receiverBands.map(rb => rb.asRange());
        return this.bands.filter(band => {
            return receiverRanges.some(rb => {
                return rb.start <= band.upper_bound && rb.end >= band.lower_bound;
            });
        });
    }
    getFilterBands() {
        return this.bands.reduce((res, band) => {
            band.tags.forEach((t) => {
                res[t] = res[t] || {
                    name: this.getTagDisplayName(t),
                    bands: []
                }
                res[t].bands.push(band);
            });
            return res;
        }, {});
    }
    getFilterTags() {
        return this.tags;
    }
    getTagDisplayName(tag) {
        return this.tags[tag] || 'Other';
    }
}

module.exports = BandService