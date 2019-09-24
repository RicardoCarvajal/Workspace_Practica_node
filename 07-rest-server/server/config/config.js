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

process.env.ENDTIME_TOKEN = '48h';


//==============================================
// SEED
//==============================================

if (process.env.NODE_ENV === 'dev') {
    process.env.SEED_TOKEN = process.env.SEED_TOKEN_PRODUC;
} else {
    process.env.SEED_TOKEN = 'secret_86926323';
}


//==============================================
// Google client id
//==============================================
process.env.CLIENT_ID = process.env.CLIENT_ID || '1056761275549-f4udmj2e06hi37ev94d1ha54mm2fm004.apps.googleusercontent.com'
