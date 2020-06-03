const express = require('express');

const app = express();

app.set('view engine', 'ejs');
app.set('views', './views');

app.get('/', (req, res) => res.render('index'));

app.use('/static', express.static('assets'));

app.listen(3000, () => console.info("Application started"));