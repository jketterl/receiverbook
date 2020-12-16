const CrawlerService = require('./app/service/CrawlerService');

process.on('uncaughtException', (err) => {
    if (err.message == 'unexpected end of file' && err.errno == -5 && err.code == 'Z_BUF_ERROR') {
        console.info('ignoring zlib error');
        return;
    }
    console.error(err);
    console.error(err.stack);
    process.exit(1);
});

require('./app/mongoose').setup().then( () => {
    console.info('crawler init complete, starting loop');

    new CrawlerService().run();
})