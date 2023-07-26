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
  // on parse car l'objet est envoyer en chaine charactère
  const sauceObject = JSON.parse(req.body.sauce);
  // supr id car généré automatiquement par la base de donnée
  delete sauceObject._id;
  // on supr userId car on ne fait pas confiance au client, on utilisera l'userId qui vient du token d'authentification
  delete sauceObject._userId;
  const sauce = new Sauce({
    ...sauceObject,
    userId: req.auth.userId,
    imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`,
  });
  sauce.save()  //enregistre dans le base de donné
    .then(() => {
      res.status(201).json({ message: "Sauce enregistré !" });
    })
    .catch((error) => {
      res.status(400).json({ error });
    });
};

// // cette route sert a effacer un produit
exports.deleteSauce = (req, res, next) => {
  //on récupère l'objet en base
  Sauce.findOne({ _id: req.params.id })
    .then((sauce) => {
      //vérifie si c'ets bien le propriétaire l'objet qui demande la supression
      if (sauce.userId != req.auth.userId) {
        res.status(403).json({ message: "Requête Non-autorisé !" });
      } else {
        // récupérer URL qui est enregistré, et recréer le chemin sur notre system de fichier a partir de celle-ci
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
  //regarder s'il y a un chant file
  const sauceObject = req.file ? {
    ...JSON.parse(req.body.sauce),
    imageUrl: `${req.protocol}://${req.get("host")}/images/${req.file.filename}`
  } : { ...req.body }; //si pas d'objet transmit, on récup l'objet dans le corp de la requette

  //pour éviter que quelqu'un crée un objet a son nom, puis le modifie pour le réasigné a quelqun d'autre
  delete sauceObject._userId;

  //récupère notre objet en base de donnée
  Sauce.findOne({ _id: req.params.id })
    .then((sauce) => {
      // Vérifie si l'userId en base est différent de l'userId du token
      if (sauce.userId != req.auth.userId) {
        res.status(401).json({ message: "Requête non authorized" });
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
  const sauceId = req.params.id;
  const userId = req.auth.userId;
  const like = req.body.like;

  Sauce.findOne({ _id: sauceId })
    .then((sauce) => {
      // Vérifier si la sauce a été trouvée
      if (!sauce) {
        return res.status(404).json({ message: "Sauce non trouvée." });
      }

      // Vérifier si like est un nombre valide (1, 0 ou -1)
      if (isNaN(like)) {
        return res.status(400).json({ message: "Valeur 'like' invalide." });
      }

      // Vérifier si l'utilisateur a déjà aimé ou pas la sauce (voir si userId se trouve dans le tableau usersLiked)
      if (sauce.usersLiked.includes(userId)) {
        if (like === 1) {
          return res.status(200).json({ message: "L'utilisateur a déjà aimé cette sauce." });
        } else if (like === 0) {
          // Retirer le like de l'utilisateur et décrémenter le compteur de likes
          Sauce.updateOne(
            { _id: sauceId },
            { $pull: { usersLiked: userId }, $inc: { likes: -1 } }
          )
            .then(() => res.status(200).json({ message: "Like supprimé avec succès." }))
            .catch((error) => res.status(500).json({ error }));
        } else if (like === -1) {
          // Retirer le like de l'utilisateur, ajouter son dislike et incrementer/décrémenter
          Sauce.updateOne(
            { _id: sauceId },
            {
              $pull: { usersLiked: userId },
              $push: { usersDisliked: userId },
              $inc: { likes: -1, dislikes: 1 },
            }
          )
            .then(() => res.status(200).json({ message: "Dislike ajouté avec succès." }))
            .catch((error) => res.status(500).json({ error }));
        } else {
          return res.status(400).json({ message: "Valeur 'like' invalide." });
        }
      } else if (sauce.usersDisliked.includes(userId)) {
        if (like === -1) {
          return res.status(200).json({ message: "L'utilisateur a déjà disliké cette sauce." });
        } else if (like === 0) {
          // Retirer le dislike de l'utilisateur et décrémenter le compteur de dislikes
          Sauce.updateOne(
            { _id: sauceId },
            { $pull: { usersDisliked: userId }, $inc: { dislikes: -1 } }
          )
            .then(() => res.status(200).json({ message: "Dislike supprimé avec succès." }))
            .catch((error) => res.status(500).json({ error }));
        } else if (like === 1) {
          // Retirer le dislike de l'utilisateur, ajouter son like et ajuster les compteurs
          Sauce.updateOne(
            { _id: sauceId },
            {
              $pull: { usersDisliked: userId },
              $push: { usersLiked: userId },
              $inc: { dislikes: -1, likes: 1 },
            }
          )
            .then(() => res.status(200).json({ message: "Like ajouté avec succès." }))
            .catch((error) => res.status(500).json({ error }));
        } else {
          return res.status(400).json({ message: "Valeur 'like' invalide." });
        }
      } else {
        // L'utilisateur n'a pas encore liké ou disliké la sauce
        if (like === 1) {
          // Ajouter le like de l'utilisateur et incrémenter le compteur de likes
          Sauce.updateOne(
            { _id: sauceId },
            { $push: { usersLiked: userId }, $inc: { likes: 1 } }
          )
            .then(() => res.status(200).json({ message: "Like ajouté avec succès." }))
            .catch((error) => res.status(500).json({ error }));
        } else if (like === -1) {
          // Ajouter le dislike de l'utilisateur et incrémenter le compteur de dislikes
          Sauce.updateOne(
            { _id: sauceId },
            { $push: { usersDisliked: userId }, $inc: { dislikes: 1 } }
          )
            .then(() => res.status(200).json({ message: "Dislike ajouté avec succès." }))
            .catch((error) => res.status(500).json({ error }));
        } else if (like === 0) {
          // L'utilisateur n'a pas encore aimé ou disliké la sauce
          return res.status(200).json({ message: "L'utilisateur n'a pas encore aimé ou disliké cette sauce." });
        } else {
          return res.status(400).json({ message: "Valeur 'like' invalide." });
        }
      }
    })
    .catch((error) => res.status(500).json({ error }));
};
