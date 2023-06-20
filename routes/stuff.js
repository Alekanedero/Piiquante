const express = require('express');
const auth = require('../middleware/auth');
const multer = require('../middleware/multer-config')
const stuffCtrl = require('../controllers/stuff');

const router = express.Router();

// cette route sert a récupérer (afficher) tout les produits
router.get('/', auth, stuffCtrl.getAllThing);

module.exports = router;