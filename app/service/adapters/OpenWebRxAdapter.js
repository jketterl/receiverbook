const OpenWebRXClassicAdapter = require('./OpenWebRXClassicAdapter');
const KeyService = require('../KeyService');
const semver = require('semver');
const moment = require('moment');
const { S3 } = require('aws-sdk');
const config = require('../../../config');

class OpenWebRxAdapter extends OpenWebRXClassicAdapter {
    async matches(baseUrl, key) {
        const normalized = this.normalizeUrl(baseUrl);

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
            const statusResponse = await this.axios().get(statusUrl.toString(), { headers })
            const sh = statusResponse.headers
            let validated = false
            if (parsedKey && 'signature' in sh && 'time' in sh) {
                validated = keyService.validateSignature({signature: sh.signature, time: sh.time}, challenge, parsedKey);
            }
            const data = statusResponse.data;
            const version = this.parseVersion(data.version);
            const bands = data.sdrs.flatMap(sdr => sdr.profiles).map(sdr => Object.assign(sdr, {'type': 'centered'}));
            if (version) {
                return {
                    name: data.receiver.name,
                    email: data.receiver.admin,
                    version,
                    // longitude first !!
                    location: [data.receiver.gps.lon, data.receiver.gps.lat],
                    validated,
                    bands
                }
            }
        } catch (err) {
            console.error('Error detecting OpenWebRX receiver: ', err.stack);
        }

        return await super.matches(baseUrl, key);
    }
    parseVersion(versionString) {
        const matches = /^v(.*)$/.exec(versionString)
        if (!matches) return false;
        try {
            return (semver.parse(matches[1]) || semver.coerce(matches[1])).toString();
        } catch (err) {
            console.error(err)
            return false;
        }
    }
    getType() {
        return "OpenWebRX (classic)"
    }
    async downloadAvatar(receiver) {
        if (!receiver.hasVersion('0.18.0')) {
            return await super.downloadAvatar(receiver);
        }

        const avatarUrl = this.normalizeUrl(receiver.url);
        avatarUrl.pathname += 'static/gfx/openwebrx-avatar.png'
        const headers = {};
        if (receiver.avatar_ctime) {
            headers["If-Modified-Since"] = receiver.avatar_ctime.toUTCString();
        }

        let response
        try {
            response = await this.axios().get(avatarUrl.toString(), {
                responseType: 'stream',
                headers
            });
        } catch (err) {
            if (err.response && err.response.status == 304) {
                // avatar has not been changed
                console.info('avatar image not changed');
                return;
            }
            console.error('Error while downloading receiver avatar: ', err.stack);
            return;
        }

        const s3 = new S3();
        await s3.upload({
            Bucket: config.avatars.bucket.name,
            Region: config.avatars.bucket.region,
            Body: response.data,
            Key: `${receiver.id}-avatar.png`
        }).promise();

        if (response.headers && response.headers['last-modified']) {
            return moment(response.headers['last-modified']).toDate();
        }
    }
}

module.exports = OpenWebRxAdapter;