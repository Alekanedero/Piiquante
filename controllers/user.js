const bcrypt = require('bcrypt');  //package de cryptage pour les mots de passe
const User = require('../models/User.js');
const jwt = require('jsonwebtoken');   //package pour créer et vérifier des tokens

// enregistrement de nouveau utilisateur
exports.signup = (req, res, next) => {
  bcrypt.hash(req.body.password, 10) // le salt "10" c'est cb de fois on hash le mot de passe
    .then(hash => { // on récupère le hash et on crée un new user
      const user = new User({
        email: req.body.email,
        password: hash
      });
      user.save() //on enregistre dans la base de donnée
        .then(() => res.status(201).json({ message: 'Utilisateur créé !' }))
        .catch(error => res.status(400).json({ error }));
    })
    .catch(error => res.status(500).json({ error }));
};

// connecter des users existant
exports.login = (req, res, next) => {
  User.findOne({email: req.body.email})
  .then(user => {
    if (user === null) { // vérifie si l'utilisateur existe sinon null donc il n'existe pas
      res.status(401).json({message: 'Paire identifiant/mot de passe incorrecte'});
    } else {  // si on a une valeur donc l'utilisateur est enregistrer en base de donnée
      bcrypt.compare(req.body.password, user.password)
      .then(valid => {
        if (!valid) {
          res.status(401).json({message: 'Paire identifiant/mot de passe incorrecte'})
        } else {
          res.status(200).json({
            userId: user._id,
            token: jwt.sign(  // crée une chaine encodée
              { userId: user._id },   // crée un objet avec l'userId
              'RANDOM_TOKEN_SECRET',  // clé secrète pour l'encodage
              { expiresIn: '24h'}     // chaque token durera 24H
            )
          });
        }
      })
      .catch(error => {
        res.status(500).json( { error });
      })
    }
  })
  .catch(error => {
    res.status(500).json( {error} );
  })
};