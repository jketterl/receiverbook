const OpenWebRXClassicAdapter = require('./OpenWebRXClassicAdapter');
const semver = require('semver');

class KiwiSdrAdapter extends OpenWebRXClassicAdapter {
    parseVersion(versionString) {
        const matches = /^KiwiSDR_v(.*)$/.exec(versionString)
        if (!matches) return false;
        try {
            return semver.coerce(matches[1]).toString();
        } catch (err) {
            console.error(err)
            return false;
        }
    }
    getType() {
        return "KiwiSDR";
    }
}

module.exports = KiwiSdrAdapter;