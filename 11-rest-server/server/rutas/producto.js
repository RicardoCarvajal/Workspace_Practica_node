const express = require('express');
const Producto = require('../modelos/producto');
const _ = require('underscore');
const { verificaToken, verificaAdminRole } = require('../middlewares/auth');

let app = express();

app.post('/producto', verificaToken, (req, res) => {
    let body = req.body;
    let usuarioToken = req.usuario._id;

    let producto = new Producto({
        nombre: body.nombre,
        precioUni: body.precioUni,
        descripcion: body.descripcion,
        disponible: body.disponible,
        categoria: body.categoria,
        usuario: usuarioToken
    });

    producto.save((err, productoDB) => {
        if (err) {
            return res.status(400).json({
                ok: false,
                err
            });
        }
        res.json({
            ok: true,
            productoDB
        });
    });

});

app.get('/producto/buscar/:termino', verificaToken, (req, res) => {

    let termino = req.params.termino;

    let regex = new RegExp(termino,'i');

    Producto.find({ nombre: regex })
        .populate('categoria', 'nombre')
        .exec((err, productos) => {
            if (err) {
                return res.status(500).json({
                    ok: false,
                    err
                });
            }
            res.json({
                ok: true,
                productos
            });
        });
});

app.get('/productos', verificaToken, (req, res) => {

    let desde = req.query.desde || 0;
    desde = Number(desde);

    let limite = req.query.limite || 0;
    limite = Number(limite);

    Producto.find({ disponible: true })
        .skip(desde)
        .populate('usuario', 'nombre email')
        .populate('categoria')
        .limit(limite)
        .exec((err, productoDB) => {
            if (err) {
                return res.status(400).json({
                    ok: false,
                    err
                });
            }

            Producto.countDocuments({ disponible: true }, (err, conteo) => {
                res.json({
                    ok: true,
                    conteo,
                    productoDB
                });
            });

        });


});

app.get('/producto/:id', verificaToken, (req, res) => {

    let id = req.params.id;

    Producto.findById(id)
        .populate('usuario', 'nombre email')
        .populate('categoria')
        .exec((err, productoDB) => {
            if (err) {
                return res.status(500).json({
                    ok: false,
                    err
                });
            }
            if (!productoDB) {
                return res.status(400).json({
                    ok: false,
                    err: {
                        message: 'No se encontro el articulo'
                    }
                });
            }
            res.json({
                ok: true,
                productoDB
            });

        });

})

app.put('/producto/:id', verificaToken, (req, res) => {

    let id = req.params.id;
    let body = _.pick(req.body, ['disponible']);

    Producto.findByIdAndUpdate(id, body, { new: true, runValidators: true }, (err, productoDB) => {
        if (err) {
            return res.status(400).json({
                ok: false,
                err
            });
        }
        res.json({
            ok: true,
            productoDB
        });
    });

});

app.delete('/producto/:id', verificaToken, (req, res) => {
    let id = req.params.id;

    Producto.findByIdAndRemove(id, (err, productoBorrado) => {
        if (err) {
            return res.status(500).json({
                ok: false,
                err
            });
        }
        if (productoBorrado === null) {
            return res.status(400).json({
                ok: false,
                err: {
                    message: 'El producto que se quiere borra no existe'
                }
            });
        }
        res.json({
            ok: true,
            productoBorrado
        });
    });
});

module.exports = app;