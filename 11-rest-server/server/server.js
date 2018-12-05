require('./config/config');
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const app = express();

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());

app.use(require('./rutas/index'));

mongoose.connect(process.env.URLDB,{
    useCreateIndex: true,
    useNewUrlParser: true
  },(err,resp)=>{
    if (err) {
        throw err;
    } else {
        console.log('Base de datos on line')
    }
});

app.listen(process.env.PORT , () => {
    console.log(`Escuchando puerto ${process.env.PORT}`);
})