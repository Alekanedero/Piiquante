const Sauce = require("../models/Sauce");
const fs = require("fs");

// cette route sert a récupérer (afficher) tout les produits
exports.getAllSauces = (req, res, next) => {
  Sauce.find() // renvoie un tableau contenant les sauces
    .then((sauces) => res.status(200).json(sauces))
    .catch((error) => res.status(400).json({ error }));
};

// cette route sert a récupérer (afficher) un seul produit
exports.getOneSauce = (req, res, next) => {
  Sauce.findOne({ _id: req.params.id })
    .then((sauce) => res.status(200).json(sauce))
    .catch((error) => res.status(404).json({ error }));
};

// cette route sert a enregistrer un produit avec une image dans la base de donnée
exports.createSauce = (req, res, next) => {
  const sauceObject = JSON.parse(req.body.sauce);
  delete sauceObject._id;
  delete sauceObject._userId;
  const sauce = new Sauce({
    ...sauceObject,
    userId: req.auth.userId,
    imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`,
  });
  sauce.save()
    .then(() => {
      res.status(201).json({ message: "Sauce enregistré !" });
    })
    .catch((error) => {
      res.status(400).json({ error });
    });
};

// // cette route sert a effacer un produit
exports.deleteSauce = (req, res, next) => {
  Sauce.findOne({ _id: req.params.id })
    .then((sauce) => {
      if (sauce.userId != req.auth.userId) {
        res.status(403).json({ message: "Requête Non-autorisé !" });
      } else {
        // récupérer URL qui est enregistré, et recréer le system de chemin a partir de celle ci
        const filename = sauce.imageUrl.split("/images/")[1];
        // faire la supression avec la method unlink de fs
        fs.unlink(`images/${filename}`, () => {
          Sauce.deleteOne({ _id: req.params.id })
            .then(() => {
              res.status(200).json({ message: "Sauce supprimé !" });
            })
            .catch((error) => res.status(401).json({ error }));
        });
      }
    })
    .catch((error) => {
      res.status(500).json({ error });
    });
};

// cette route sert a mofidier un produit existant
exports.modifySauce = (req, res, next) => {
  const sauceObject = req.file ? {
    ...JSON.parse(req.body.sauce),
    imageUrl: `${req.protocol}://${req.get("host")}/images/${req.file.filename}`
  } : { ...req.body };

  delete sauceObject._userId;

  Sauce.findOne({ _id: req.params.id })
    .then((sauce) => {
      // Vérifie si l'auteur de la sauce est bien la personne connectée
      if (sauce.userId != req.auth.userId) {
        res.status(403).json({ message: "Requête non authorized" });
      } else {
        // On récupère le contenu du fichier image dans la requête 
        const testReqFile = req.file;
        // S'il n'existe pas, on met simplement à jour les modifications
        if (!testReqFile){
            Sauce.updateOne({ _id: req.params.id}, { ...sauceObject, _id: req.params.id})
                .then(() => res.status(200).json({message : 'Sauce modifiée!'}))
                .catch(error => res.status(401).json({ error }));
        } 
        // S'il existe, il faut supprimer l'ancienne image dans le dossier 'images'
        else {
            // On récupère le nom du fichier de l'image de la sauce dans le dossier images
            const filenameStock = sauce.imageUrl.split('/images/')[1];
            // Et, on le supprime avec 'unlink', puis on met à jour les modifications
            fs.unlink(`images/${filenameStock}`, () => {
                Sauce.updateOne({ _id: req.params.id}, { ...sauceObject, _id: req.params.id})
                .then(() => res.status(200).json({message : 'Sauce modifiée!'}))
                .catch(error => res.status(401).json({ error }));
            }) 
        } 
    }
})
    .catch((error) => {
      res.status(400).json({ error });
    });
};


// Cette route sert à ajouter ou enlever un like
exports.likeSauce = (req, res, next) => {
  //  On récupère le sauceId
  const sauceId = req.params.id;
  // On récupère l'userId
  const userId = req.auth.userId;
  // On récupère le like de la requette body
  const like = req.body.like;

  Sauce.findOne({ _id: sauceId })
    .then((sauce) => {
      // Vérifier si l'utilisateur a déjà aimé la sauce
      if (sauce.usersLiked.includes(userId)) {
        // Si l'utilisateur a déjà aimé la sauce et like = 1, on ne fait rien
        if (like === 1) {
          res.status(200).json({ message: "L'utilisateur a déjà aimé cette sauce." });
        }
        // Si l'utilisateur a déjà aimé la sauce et like = 0, on supprime son like
        else if (like === 0) {
          Sauce.updateOne(
            { _id: sauceId },
            { $pull: { usersLiked: userId }, $inc: { likes: -1 } }
          )
            .then(() => res.status(200).json({ message: "Like supprimé avec succès." }))
            .catch((error) => res.status(500).json({ error }));
        }
        // Si l'utilisateur a déjà aimé la sauce et like = -1, on supprime son like et ajoute son dislike
        else if (like === -1) {
          Sauce.updateOne(
            { _id: sauceId },
            {
              // On supprime l'identifiant de l'utilisateur du tableau usersLiked de la sauce.
              $pull: { usersLiked: userId },
              // On ajoute l'identifiant de l'utilisateur au tableau usersDisliked de la sauce.
              $push: { usersDisliked: userId },
              // On décrémente le compteur likes de la sauce d'une unité et incrémente le compteur dislikes d'une unité.
              $inc: { likes: -1, dislikes: 1 },
            }
          )
            .then(() => res.status(200).json({ message: "Dislike ajouté avec succès." }))
            .catch((error) => res.status(500).json({ error }));
        }
        else {
          res.status(400).json({ message: "Valeur 'like' invalide." });
        }
      }
      // Si l'utilisateur n'a pas encore aimé la sauce
      else {
        // Si like = 1, on ajoute son like
        if (like === 1) {
          Sauce.updateOne(
            { _id: sauceId },
            { $push: { usersLiked: userId }, $inc: { likes: 1 } }
          )
            .then(() => res.status(200).json({ message: "Like ajouté avec succès." }))
            .catch((error) => res.status(500).json({ error }));
        }
        // Si like = 0, on ne fait rien car l'utilisateur n'a pas encore aimé la sauce
        else if (like === 0) {
          res.status(200).json({ message: "L'utilisateur n'a pas encore aimé cette sauce." });
        }
        // Si like = -1, on ajoute son dislike
        else if (like === -1) {
          Sauce.updateOne(
            { _id: sauceId },
            { $push: { usersDisliked: userId }, $inc: { dislikes: 1 } }
          )
            .then(() => res.status(200).json({ message: "Dislike ajouté avec succès." }))
            .catch((error) => res.status(500).json({ error }));
        }
        else {
          res.status(400).json({ message: "Valeur 'like' invalide." });
        }
      }
    })
}


// Définit le statut « Like » pour l' userId fourni. Si like = 1, l'utilisateur aime (= like) la sauce. Si like = 0, l'utilisateur annule son like ou son dislike. Si like = -1, l'utilisateur n'aime pas (= dislike) la sauce. L'ID de l'utilisateur doit être ajouté ou retiré du tableau approprié. Cela permet de garder une trace de leurs préférences et les empêche de liker ou de ne pas disliker la même sauce plusieurs fois : un utilisateur ne peut avoir qu'une seule valeur pour chaque sauce. Le nombre total de « Like » et de « Dislike » est mis à jour à chaque nouvelle notation.
