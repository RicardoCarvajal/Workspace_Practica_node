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
    urlDB = 'mongodb://localhost:27017/basededatos';
} else {
    urlDB = process.env.MONGO_URI; // variable de entorno creada con heroku
}

process.env.URLDB = urlDB;

//==============================================
// TOKEN TIME
//==============================================

process.env.ENDTIME_TOKEN = 60 * 60 * 24 * 30;


//==============================================
// SEED
//==============================================

if (process.env.NODE_ENV === 'dev') {
    process.env.SEED_TOKEN = process.env.SEED_TOKEN_PRODUC;
} else {
    process.env.SEED_TOKEN = 'secret';
}