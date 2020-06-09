class CrawlerService {
    constructor() {
        // 30 minute interval
        this.interval = 1 * 60 * 1000;
    }
    run() {
        this.schedule();
    }
    schedule(when) {
        const now = new Date().getTime();
        let remaining = 0;
        if (when) {
            remaining = when - now;
        }
        setTimeout(() => {
            this.collectAll().finally( () => {
                this.schedule(now + this.interval)
            })
        }, remaining);
    }
    collectAll() {
        return new Promise( (resolve) => {
            console.info('would now collect all');
            process.nextTick(resolve);
        });
    }
}

module.exports = CrawlerService;