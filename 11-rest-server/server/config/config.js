//==============================================
// Puertos
//==============================================

process.env.PORT = process.env.PORT || 3000;

//==============================================
// Entorno
//==============================================

process.env.NODE_ENV = process.env.NODE_ENV || 'dev';

//==============================================
// Puertos
//==============================================

let urlDB;

if (process.env.NODE_ENV === 'dev') {
    urlDB = 'mongodb://localhost:27017/credix';
} else {
    urlDB = process.env.MONGO_URI; // variable de entorno creada con heroku
}

process.env.URLDB = urlDB;