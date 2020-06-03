const express = require('express');
const expressLayouts = require('express-ejs-layouts');

const app = express();

app.set('view engine', 'ejs');
app.set('views', './views');
app.use(expressLayouts);

app.get('/', (req, res) => res.render('index'));

app.use('/static', express.static('assets'));

app.listen(3000, () => console.info("Application started"));