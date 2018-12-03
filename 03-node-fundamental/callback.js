let getUsuarioById = (id, callback) => {
    let usuario = {
        nombre: 'Ricardo',
        id 
    }
    
    if (id === 20) {
        callback(`El usuario con ${id} no esta en db`);
    }else{
        callback(null,usuario);
    }

}

getUsuarioById(1,(err,usuario) => {

    if (err) {
        return console.log(err);
    }

    console.log('Usuario de base de datos', usuario);
});

