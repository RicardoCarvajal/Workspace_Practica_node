/*Una promesa representa algo que esta por completarse o va a fallar 
La pormesa tiene 3 estados 1- Pendiente 2- Satisfactorio 3- rechasado 

Una promesa es un objeto o funcion que tiene un metodo then()

Las promesas no estan disponibles para todo tipo de navegadores por lo
que esxisten polyfill que nos ayudan a darle a nuestros navegadores lo
que le falta. Hay una pagina que nos da un script que se adapta a los navegadores
haciendo que los mismos descarguen solo lo necesario https://polyfill.io/v3/

Las promeas no son recomendables para programar eventos
*/


/*Como ejemplo de como las promesas no ayudan en el manejo de la asincronia
tenemos 3 funciones que queremos que se ejecuten en el orden establecido a continuacion
pero las funciones pueden tardar tiempos diferentes y como javascript trabaja de manera asincrona
que se ejecuten en el orden establecido no es posible, y una de las maneras de hacerlo posible es
con las promesas
*/

/*
let getUsers = () => {
    setTimeout(() => {
        console.log("1- Usuario listo para trabajar");
    }, 800);
}


let getProjects = () => {
    setTimeout(() => {
        console.log("2- Proyecto listo para trabajar");
    }, 400);
}


let getIssues = () => {
    setTimeout(() => {
        console.log("3- Tarea listo para trabajar");
    }, 700);
}

getUsers();
getProjects();
getIssues();
*/

/*El codigo anterior vemos el ejemplo en el cual no se puede trabajar de manera sincrona
a continuacion vamos a aplicar el concepto de las prmesas para trabajar de manera sincrona
*/

/*1 */
let getUsersPro = () => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            console.log("1- Usuario ejecutandose");
            /*El mandar a ejecutar el resolve o el reject depende
            de el proceso que estas programando en cada metodo y 
            de la respuesta que te llega despues de la espera
            */

            /*Lo que responden los metodos programados cuando
            son promesas se pasan como parametros dentro de resolve
            y es algo que esta estandarizado de esa forma
            */
            resolve([1, 2, 3, 4, 5]);
            /*En el caso de que la se utiliza el reject por el fallo de
            una promesa la misma simpre debe tener una razon (reason)
            es decir por que falla una promesa para que cuando sea atajado
            el error en el catch, tengamos el error especificado

            EJ:

            reject('Error de procesamiento de datos');
            */

        }, 800);
    });
}

/*2 */
let getProjectsPro = () => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            console.log("2- Proyecto ejecutandose");
            resolve();
        }, 400);
    });
}

/*2 */
let getIssuesPro = () => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            console.log("3- Tarea ejecutandose");
            resolve();
        }, 700);
    });
}

console.time('Tiempo');
getUsersPro()
    .then((resp) => {
        /*Una promesa debe poder obtener valores de retornos inyectados
        por el resolve() programado en el metodo
        */
        console.log(resp);
        /*tambien en el manejo de promesas podemos tirar errores de esta forma
        en el caso de que queramos emitir errores en el caso de los procesos que atajan 
        los valores devueltos por una promesa
        */
        /*
        throw 'Error promise';
        */
        return getProjectsPro();
    })
    .then(getIssuesPro)
    .catch((err) => {
        console.error("Error una de las promesas no se ejecuto correctamente:", err);
    });
console.timeEnd('Tiempo');
/* Cuando hay un error en cualquiera de las promesas o en otras palabras el metodo
reject() se dispara el flujo del proceso se va siempre directo al catch.

Si hay varios catch entre las promesas cuando una promesa da error la misma se va al
catch mas inmediato a ella
*/