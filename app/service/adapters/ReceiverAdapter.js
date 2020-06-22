const UserService = require('../UserService');
const axios = require('axios');
const { S3 } = require('aws-sdk');
const config = require('../../../config');
const moment = require('moment');

class ReceiverAdapter {
    axios() {
        if (!this.axiosInstance) {
            this.axiosInstance = axios.create({
                timeout: 10000
            });
        }
        return this.axiosInstance;
    }
    normalizeUrl(url) {
        const normalized = new URL(url);
        if (!normalized.pathname.endsWith('/')) {
            normalized.pathname += '/';
        }
        return normalized
    }
    async matches(baseUrl, key) {
        return false;
    }
    async updateReceiver(receiver) {
        console.info(`updating "${receiver.label}"`);
        const status = await this.getReceiverData(receiver);
        if (receiver.status === 'pending' || receiver.status === 'new') {
            if (status && status.validated) {
                // switch receiver online if validated
                console.info(`"${receiver.label}" has passed verification, setting online`)
                receiver.status = 'online'
            } else {
                receiver.status = 'pending';
            }
        } else {
            if (status) {
                if (status.validated) {
                    receiver.status = 'online';
                } else {
                    // switch back to pending if validation failed
                    console.info(`"${receiver.label}" has failed verifiation, setting pending`)
                    receiver.status = 'pending';
                }
            } else {
                receiver.status = 'offline';
            }
        }
        if (status) {
            this.applyCrawlingResult(receiver, status);
        }

        if (receiver.status == 'online') {
            const ctime = await this.downloadAvatar(receiver);
            if (ctime) {
                receiver.avatar_ctime = ctime;
            }
        }

        await receiver.save();
    }
    applyCrawlingResult(receiver, data) {
        receiver.label = data.name;
        receiver.version = data.version;
        let location;
        if (data.location) {
            location = {
                type: 'Point',
                coordinates: data.location
            }
        }
        receiver.location = location;
        receiver.bands = data.bands;
    }
    async getReceiverData(receiver) {
        const status = await this.matches(receiver.url, receiver.key);
        if (status.email) {
            status.validated = status.validated || await this.validateEMail(receiver, status.email);
        }
        return status;
    }
    async validateEMail(receiver, email) {
        const userService = new UserService();
        const user = await userService.getUserDetails(receiver.owner);
        return user.email_verified && user.email === email;
    }
    getAvatarUrl(receiver) {
        return false;
    }
    async downloadAvatar(receiver) {
        const avatarUrl = this.getAvatarUrl(receiver);
        if (!avatarUrl) {
            return
        }

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
        } else {
            return new Date();
        }
    }
}

module.exports = ReceiverAdapter;