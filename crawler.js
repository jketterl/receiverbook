const CrawlerService = require('./app/service/CrawlerService');

require('./app/mongoose').setup().then( () => {
    console.info('crawler init complete, starting loop');

    new CrawlerService().run();
})