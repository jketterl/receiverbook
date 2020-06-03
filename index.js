const express = require('express');

const app = express();

app.get('/', (req, res) => res.send('Hello radio world!'));

app.listen(3000, () => console.info("Application started"));