let usuario = {
    nombre: 'Ricardo',
    CI:'1671545849',
    correo:'rjsud@gmail.com',
    getNombre: function(){
        return `${this.nombre} - ${this.CI} - ${this.correo}`
    }
};

console.log(`LOG 1: ${usuario.getNombre()}`);

//let nombre = usuario.nombre;
//let CI = usuario.CI;
//let correo = usuario.correo;

let {nombre:primerombre,CI,correo} = usuario;

console.log(`LOG 2: ${primerombre} - ${correo} - ${CI}`);






