const ReceiverAdapter = require('./ReceiverAdapter');
const Maidenhead = require('maidenhead');
const axios = require('axios');
const { JSDOM } = require('jsdom');

class WebSdrAdapter extends ReceiverAdapter {
    async matches(baseUrl, key) {
        const normalized = new URL(baseUrl);
        if (!normalized.pathname.endsWith('/')) {
            normalized.pathname += '/';
        }

        var calls = [
            this.getStatus(normalized)
        ]
        if (key) {
            calls.push(this.getAuth(normalized, key));
        }
        try {
            const [status, auth] = await Promise.all(calls);
            status.validated = auth;
            return status
        } catch (err) {
            console.error('Error detecting Websdr receiver: ', err);
        }

        return false
    }
    async getStatus(normalized) {
        const statusUrl = new URL(normalized);
        statusUrl.pathname += '~~orgstatus';
        const statusResponse = await axios.get(statusUrl.toString())
        const parsed = this.parseResponse(statusResponse.data);
        let location;
        if ('Qth' in parsed) {
            location = this.parseLocator(parsed['Qth'])
        }
        let email;
        if ('Email' in parsed) {
            email = this.parseEmail(parsed['Email'])
        }
        return {
            name: parsed['Description'],
            location,
            email
        }
    }
    async getAuth(normalized, key) {
        const response = await axios.get(normalized.toString());
        const dom = new JSDOM(response.data);
        const tags = dom.window.document.querySelectorAll('meta[name=receiverbook-secret]');
        if (tags) {
            const results = Array.prototype.map.call(tags, tag => tag.content === key);
            return results.reduce((acc, v) => acc || v, false);
        }
        return false;
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
    parseLocator(locatorString) {
        const locator = new Maidenhead();
        locator.locator = locatorString;
        if (locator.lat && locator.lon) {
            // longitude first!!
            return [locator.lon, locator.lat];
        }
        return false;
    }
    parseEmail(inputString) {
        if (inputString.indexOf('@') >= 0) {
            return inputString;
        }
        const chars = Buffer.from(inputString, 'utf-8').map(i => i ^ 1);
        return chars.toString('utf-8');
    }
}

module.exports = WebSdrAdapter;