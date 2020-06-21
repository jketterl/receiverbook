const UserService = require('../UserService');
const axios = require('axios');

class ReceiverAdapter {
    axios() {
        if (!this.axiosInstance) {
            this.axiosInstance = axios.create({
                timeout: 10000
            });
        }
        return this.axiosInstance;
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
}

module.exports = ReceiverAdapter;