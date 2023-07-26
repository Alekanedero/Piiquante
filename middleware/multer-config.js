const multer = require('multer');

const MIME_TYPES = {
  'image/jpg': 'jpg',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp'
};

// objet de config multer
const storage = multer.diskStorage({  // on l'enregistre sur le disk
  destination: (req, file, callback) => {
    callback(null, 'images');  // null pour dire quil n'y a pas eu d'erreur, et le nom du dossier
  },
  // expliquer le nom du fichier que l'on souhaite utiliser
  filename: (req, file, callback) => {
    //nom d'origine, split(crée un tab), join(remplacer les espaces par des underscores)
    const name = file.originalname.split(' ').join('_');
    // crée extension qui sera l'élément de notre dictionnaire qui correspond au mimetype envoyer par le frontend
    const extension = MIME_TYPES[file.mimetype];
    //null pour pas d'erreur, milliseconde prés, un . et l'extension
    callback(null, name + Date.now() + '.' + extension);
  }
});

// method single pour dire qu'il s'agit d'un fichier unique, et on explqie a multer qu'il s'agit d'une image uniquement
module.exports = multer({ storage }).single('image');