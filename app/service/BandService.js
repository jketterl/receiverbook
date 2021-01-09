const bandPlan = require('../../config/bands.json');
const si = require('si-prefix');

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
        this.ranges = {
            "vlf": {
                name: "VLF",
                lower_bound: 3000,
                upper_bound: 30000
            },
            "lf": {
                name: "LF",
                lower_bound: 30000,
                upper_bound: 300000
            },
            "mf": {
                name: "MF",
                lower_bound: 300000,
                upper_bound: 3000000
            },
            "hf": {
                name: "HF",
                lower_bound: 3000000,
                upper_bound: 30000000
            },
            "vhf": {
                name: "VHF",
                lower_bound: 30000000,
                upper_bound: 300000000,
            },
            "uhf": {
                name: "UHF",
                lower_bound: 300000000,
                upper_bound: 3000000000
            },
            "shf": {
                name: "SHF",
                lower_bound: 3000000000,
                upper_bound: 30000000000
            }
        }
        this.frequencyUnit = new si.Unit(new si.Scale(), 'Hz');
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
    getRange(id) {
        return this.ranges[id];
    }
    getFilterRanges() {
        return Object.fromEntries(
            Object.entries(this.ranges).map(([id, r]) => {
                return [id, this.getRangeDisplayText(r)]
            })
        )
    }
    getRangeDisplayText(range) {
        return `${range.name} (${this.frequencyUnit.format(range.lower_bound)} - ${this.frequencyUnit.format(range.upper_bound)})`;
    }
    getSiPrefixed(value, unit) {
        if (value < 1000) return unit;

    }
}

module.exports = BandService