const jwt = require('jsonwebtoken');
//==============================================
// Verificar Token
//==============================================

let verificaToken = (req, res, next) => {

    let token = req.get('token');

    jwt.verify(token, process.env.SEED_TOKEN, (err, decoded) => {
        if (err) {
            return res.status(401).json({
                ok: false,
                err
            });
        }

        req.usuario = decoded.usuario;

        next();

    });



    /* let token = req.get('token');
    res.json({
        token
    }) */
}

module.exports = {
    verificaToken
}