const express = require('express');
const router = express.Router();
const userCtrl = require('../controllers/user');

// Ce sont des routes post car le frontend va envoyer des infos (email + mot de passe)
router.post('/signup', userCtrl.signup);
router.post('/login', userCtrl.login);

module.exports = router;