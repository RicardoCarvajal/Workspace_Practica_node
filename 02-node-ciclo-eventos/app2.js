console.log('Inicio del programa');

setTimeout(function(){
    console.log('Primer timeout');
}, 3000);

setTimeout(function(){
    console.log('segundo timeout');
}, 0);

setTimeout(function(){
    console.log('Tercero timeout');
}, 0);

console.log('Fin del programa');