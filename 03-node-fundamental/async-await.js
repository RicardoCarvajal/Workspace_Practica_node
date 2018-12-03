/* let getNombre = async() => {
    return 'Ricardo';
};

getNombre().then( nombre =>{
    console.log(nombre);
}).catch(e => {
    console.log(e)
}); */

let getNombre = () => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve('Ricardo');
        }, 3000);
    });
};

let getSaludo = async () => {

    let nombre = await getNombre();

    return `Hola ${nombre}`;
}

getSaludo().then(mensaje => {
    console.log(mensaje);
}).catch(e => {
    console.log(e)
});

