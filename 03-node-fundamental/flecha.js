let sumar = (a,b) => a+b;

let getNombre = () => 'Ricardo';

let usuario = {
    nombre: 'Ricardo',
    CI:'1671545849',
    correo:'rjsud@gmail.com',
    getUsuario: () => `${this.nombre} - ${this.CI} - ${this.correo}`
}; // Con la funcion flecha hay que tener cuidado con el this, pues apunta a lo que valga this fuera de la funcion

console.log(`${getNombre()} edad: ${sumar(4,30)}`);
console.log(usuario.getUsuario());