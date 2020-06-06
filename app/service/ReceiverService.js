const axios = require('axios');
const semver = require('semver');

class ReceiverDetector {
    async matches(baseUrl) {
        return false;
    }
}

class OpenWebRxReceiverDetector extends ReceiverDetector {
    async matches(baseUrl) {
        const normalized = new URL(baseUrl);
        if (!normalized.pathname.endsWith('/')) {
            normalized.pathname += '/';
        }

        try {
            const statusUrl = new URL(normalized);
            statusUrl.pathname += 'status.json';
            const statusResponse = await axios.get(statusUrl.toString())
            const version = this.parseVersion(statusResponse.data.version)
            if (version) {
                return {
                    name: statusResponse.data.receiver.name,
                    version
                }
            }
        } catch (err) {
            console.error('Error detecting OpenWebRX receiver: ', err);
        }

        try {
            const statusUrl = new URL(normalized);
            statusUrl.pathname += 'status';
            const statusResponse = await axios.get(statusUrl.toString())

            return {
                name: statusResponse.receiver.name
            }
        } catch (err) {
            console.error('Error detecting OpenWebRX receiver (old style): ', err);
        }

        return false
    }
    parseVersion(versionString) {
        const matches = /^v(.*)$/.exec(versionString)
        try {
            return semver.coerce(versionString).toString();
        } catch (err) {
            console.error(err)
            return false;
        }
    }
}

class ReceiverService {
    constructor(){
        this.detectors = {
            'openwebrx': OpenWebRxReceiverDetector
        }
    }
    async detectReceiverType(url) {
        const resultArray = await Promise.all(
            Object.entries(this.detectors).map(async ([type, detectorCls]) => {
                const detector = new detectorCls();
                return [type, await detector.matches(url)];
            })
        );
        return Object.fromEntries(resultArray.filter(e => e[1]));
    }
}

module.exports = ReceiverService;