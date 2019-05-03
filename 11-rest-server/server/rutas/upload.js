const express = require('express');
const fileupload = require('express-fileupload');
const app = express();
const Usuario = require('../modelos/usuario');
const Producto = require('../modelos/producto');
const fs = require('fs');
const path = require('path');

app.use(fileupload());

app.put('/upload/:tipo/:id', (req, res) => {

    let tipo = req.params.tipo;
    let id = req.params.id;


    if (!req.files) {
        return res.status(400).json({
            ok: false,
            err: {
                message: 'No se ha seleccionado ningún archivo'
            }
        });
    }

    let tiposValidos = ['productos', 'usuarios'];

    if (tiposValidos.indexOf(tipo) < 0) {
        return res.status(500).json({
            ok: false,
            err: {
                message: `Tipo invalido, los tipos validos son ${tiposValidos.join(', ')}`,
                tipo
            },
        });
    }

    let simpleFile = req.files.simpleFile;

    let nombreArchivo = simpleFile.name.split('.');

    let ext = nombreArchivo[nombreArchivo.length - 1];

    let extencionesValidas = ['png', 'jpg', 'gif', 'jpeg'];

    if (extencionesValidas.indexOf(ext) < 0) {
        return res.status(500).json({
            ok: false,
            err: {
                message: `Extencion invalida, las extenciones validas son ${extencionesValidas.join(', ')}`
            }
        });
    }

    let nameFileUp = `${id}-${new Date().getMilliseconds()}.${ext}`;

    simpleFile.mv(`uploads/${tipo}/${nameFileUp}`, (err) => {
        if (err) {
            return res.status(500).json({
                ok: false,
                err
            });
        }

        if (tipo === 'productos') {
            imagenProducto(id, res, nameFileUp, tipo);
        } else {
            imagenUsuario(id, res, nameFileUp, tipo);
        }
    });
});

function imagenUsuario(id, res, nombreArchivo, tipo) {

    Usuario.findById(id, (err, usuarioDB) => {
        if (err) {
            borrarArchivo(nombreArchivo, tipo);
            return res.status(500).json({
                ok: false,
                err
            });
        }

        if (!usuarioDB) {
            borrarArchivo(nombreArchivo, tipo);
            return res.status(500).json({
                ok: false,
                err: {
                    message: 'Usuario no existe'
                }
            });
        }

        borrarArchivo(usuarioDB.img, tipo);

        usuarioDB.img = nombreArchivo;

        usuarioDB.save((err, usuarioGuardado) => {
            res.json({
                ok: true,
                usuario: usuarioGuardado,
                img: nombreArchivo
            });

        });


    });

}

function imagenProducto(id, res, nombreArchivo, tipo) {
    Producto.findById(id, (err, productoDB) => {
        if (err) {
            borrarArchivo(nombreArchivo, tipo);
            return res.status(500).json({
                ok: false,
                err
            });
        }

        if (!productoDB) {
            borrarArchivo(nombreArchivo, tipo);
            return res.status(500).json({
                ok: false,
                err: {
                    message: 'Producto no existe'
                }
            });
        }

        borrarArchivo(productoDB.img, tipo);

        productoDB.img = nombreArchivo;

        productoDB.save((err, productoGuardado) => {
            res.json({
                ok: true,
                usuario: productoGuardado,
                img: nombreArchivo
            });

        });


    });
}

function borrarArchivo(nombreImg, tipo) {
    let pathImg = path.resolve(__dirname, `../../uploads/${tipo}/${nombreImg}`);

    if (fs.existsSync(pathImg)) {
        fs.unlinkSync(pathImg);
    }

}

module.exports = app;