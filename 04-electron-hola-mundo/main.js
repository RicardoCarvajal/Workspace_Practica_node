const {app,BrowserWindow} = require('electron');

let win

function createWindow() {
   
    win = new BrowserWindow({  })

    // y carga el archivo index.html de la aplicación.
    win.loadFile('index.html')
  
    // Emitido cuando la ventana es cerrada.
    win.on('closed', () => {
      // Elimina la referencia al objeto window, normalmente  guardarías las ventanas
      // en un vector si tu aplicación soporta múltiples ventanas, este es el momento
      // en el que deberías borrar el elemento correspondiente.
      win = null
    })
   
}

app.on('ready',createWindow);

app.on('window-all-closed', () => {
    // En macOS es común para las aplicaciones y sus barras de menú
    // que estén activas hasta que el usuario salga explicitamente con Cmd + Q
    if (process.platform !== 'darwin') {
      app.quit()
    }
  })

  app.on('activate', () => {
    // En macOS es común volver a crear una ventana en la aplicación cuando el
    // icono del dock es clicado y no hay otras ventanas abiertas.
    if (win === null) {
      createWindow()
    }
  })