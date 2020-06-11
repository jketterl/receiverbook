const ReceiverAdapter = require('./ReceiverAdapter');
const KeyService = require('../KeyService');
const semver = require('semver');
const axios = require('axios');

class OpenWebRxAdapter extends ReceiverAdapter {
    async matches(baseUrl, key) {
        const normalized = new URL(baseUrl);
        if (!normalized.pathname.endsWith('/')) {
            normalized.pathname += '/';
        }

        const headers = {};
        const keyService = new KeyService();
        let challenge;
        let parsedKey;
        if (key) {
            parsedKey = keyService.parse(key);
            challenge = keyService.generateChallenge(parsedKey);
            headers['Authorization'] = keyService.getAuthorizationHeader(challenge);
        }

        try {
            const statusUrl = new URL(normalized);
            statusUrl.pathname += 'status.json';
            const statusResponse = await axios.get(statusUrl.toString(), { headers })
            const sh = statusResponse.headers
            let validated = false
            if (parsedKey && 'signature' in sh && 'time' in sh) {
                validated = keyService.validateSignature({signature: sh.signature, time: sh.time}, challenge, parsedKey);
            }
            const data = statusResponse.data;
            const version = this.parseVersion(data.version)
            if (version) {
                return {
                    name: data.receiver.name,
                    version,
                    // longitude first !!
                    location: [data.receiver.gps.lon, data.receiver.gps.lat],
                    validated
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
            const location = this.parseCoordinates(parsed.gps);
            if (version) {
                return {
                    name: parsed.name,
                    version,
                    location
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

module.exports = OpenWebRxAdapter;