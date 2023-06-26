const express = require('express');
const auth = require('../middleware/auth');
const multer = require('../middleware/multer-config')
const sauceCtrl = require('../controllers/sauce');

const router = express.Router();

// cette route sert a afficher une ou des sauces
router.get('/', auth, sauceCtrl.getAllSauces);
router.get('/:id/', auth, sauceCtrl.getOneSauce)

// cette route sert a enregistrer un produit dans la base de donnée
router.post('/', auth, multer, sauceCtrl.createSauce);

// cette route sert a mofidier une sauce existante
router.put('/:id', auth, multer, sauceCtrl.modifySauce);

// cette route sert a effacer une sauce
router.delete('/:id', auth, sauceCtrl.deleteSauce);

// cette route sert a mettre un like ou l'enlever
router.post('/:id/like', auth, sauceCtrl.likeSauce)

module.exports = router;