/*Estas palabras reservadas se usan solo en el ECMASCRIPT 7 y se utilizan para
manejar la asincronia de javascript.


Se implementa simplemete colocando las funciones que deseamos ejecutar de manera 
sincrona dentro de una funcion padre que en su declaracion tiene la palabra async,
los metodos que se desean ejecutar de manera sincrona dentro de la funcion padre 
declarada se llaman anteponiendo a ella la palabra reservada await y estos metodos
deben retornar una promesa.

Cabe detacar que si a cualquier funcion se le pone la palabra reservada async en su
declaracion, la misma pasa a retornar una promesa, por la cual las funciones hijas del 
ejemplo se pueden declarar con la palabra async para que retornen una promesa. Por ejemplo 
las dos siguientes funciones retornan lo mismo.
*/

let getNombrePruebaAsync = async() => {
    return 'Ricardo Async';
}

let getNombrePrueba = () => {
    return new Promise(
        (resolve, reject) => {
            resolve('Ricardo');
        });
}

console.log(getNombrePrueba());
console.log(getNombrePruebaAsync());

/*

Cabe destacar que al utilizar esta herramientas del async-await se pueden manejar 
los errores por medio de un try-catch.

*/

let empleados = [
    { id: 1, nombre: 'Ricardo' }, { id: 2, nombre: 'Jose' }, { id: 3, nombre: 'Mario' }
];

let salarios = [
    { id: 1, salario: 10000 }, { id: 2, salario: 13000 }
];

/*Estos dos metodos se utilizan para demorar el proceso */

let getProjectsPro = async() => {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(2);
        }, 2000);
    });
}

let wait = async() => {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve();
        }, 2000);
    });
}

/*
Esta es una funcion hija la cual retorna una promesa por usar la palabra reservada
async
*/

let getEmpleado = async(id) => {
    console.log('Buscando empleado');

    //await wait();

    let emp = empleados.find(empleado => empleado.id === id);

    if (!emp) {
        throw new Error('Empleado no encontrado');
    } else {
        return emp;
    }
}

/*
Esta es una funcion hija la cual retorna una promesa por usar la palabra reservada
async
*/

let getSalario = async(empleado) => {
    let sal = salarios.find(salario => salario.id === empleado.id);

    if (!sal) {
        throw new Error('Salario no encontrado');
    } else {
        return sal;
    }
}

let getInformation = async() => {
    try {
        console.time('Tiempo getProjectsPro');
        let id = await getProjectsPro();
        console.timeEnd('Tiempo getProjectsPro');
        console.time('Tiempo getEmpleado');
        let empleado = await getEmpleado(id);
        console.log(empleado);
        console.timeEnd('Tiempo getEmpleado');
        console.time('Tiempo getSalario');
        let salario = await getSalario(empleado);
        console.log(salario);
        console.timeEnd('Tiempo getSalario');
    } catch (error) {
        console.error(error);
    }
}


/*Ejecutando el proceso de ejemplo */
getInformation();