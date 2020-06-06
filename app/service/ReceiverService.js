const axios = require('axios');
const semver = require('semver');

class ReceiverDetector {
    async matches(baseUrl) {
        return false;
    }
    parseResponse(response) {
        return Object.fromEntries(response.split('\n').map((line) => {
            const items = line.split('=');
            return [items[0], items.slice(1).join(': ')];
        }));
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
            //console.error('Error detecting OpenWebRX receiver: ', err);
        }

        try {
            const statusUrl = new URL(normalized);
            statusUrl.pathname += 'status';
            const statusResponse = await axios.get(statusUrl.toString())
            const parsed = this.parseResponse(statusResponse.data);
            const version = this.parseVersion(parsed.sw_version);
            if (version) {
                return {
                    name: parsed.name,
                    version
                }
            }
        } catch (err) {
            //console.error('Error detecting OpenWebRX receiver (old style): ', err);
        }

        return false
    }
    parseVersion(versionString) {
        const matches = /^v(.*)$/.exec(versionString)
        if (!matches) return false;
        try {
            return semver.coerce(matches[1]).toString();
        } catch (err) {
            console.error(err)
            return false;
        }
    }
}

class WebSdrReceiverDetector extends ReceiverDetector {
    async matches(baseUrl) {
        const normalized = new URL(baseUrl);
        if (!normalized.pathname.endsWith('/')) {
            normalized.pathname += '/';
        }

        try {
            const statusUrl = new URL(normalized);
            statusUrl.pathname += '~~orgstatus';
            const statusResponse = await axios.get(statusUrl.toString())
            const parsed = this.parseResponse(statusResponse.data);
            return {
                name: parsed['Description']
            }
        } catch (err) {
            //console.error('Error detecting Websdr receiver: ', err);
        }

        return false
    }
    parseResponse(response) {
        const parsed = response.split('\n').map((line) => {
            const items = line.split(': ');
            return [items[0], items.slice(1).join(': ')];
        });

        const bands = parsed.filter(b => b[0] === 'Band').map(b => b[1]);

        const composed = Object.fromEntries(parsed.filter(b => b[0] !== 'Band'))
        composed.Bands = bands;
        return composed;
    }
}

class KiwiSdrRecevierDetector extends ReceiverDetector {
    async matches(baseUrl) {
        const normalized = new URL(baseUrl);
        if (!normalized.pathname.endsWith('/')) {
            normalized.pathname += '/';
        }

        try {
            const statusUrl = new URL(normalized);
            statusUrl.pathname += 'status';
            const statusResponse = await axios.get(statusUrl.toString())
            const parsed = this.parseResponse(statusResponse.data);
            const version = this.parseVersion(parsed.sw_version);
            if (version) {
                return {
                    name: parsed.name,
                    version
                }
            }
        } catch (err) {
            console.error('Error detecting KiwSDR receiver: ', err);
        }
    }
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
}

class ReceiverService {
    constructor(){
        this.detectors = {
            'openwebrx': OpenWebRxReceiverDetector,
            'websdr': WebSdrReceiverDetector,
            'kiwisdr': KiwiSdrRecevierDetector
        }
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
}

module.exports = ReceiverService;