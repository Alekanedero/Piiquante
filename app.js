// importer
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const path = require("path");

const sauceRoutes = require('./routes/sauce')
const userRoutes = require('./routes/user')

// se connecter a Mongodb
mongoose.connect('mongodb+srv://alex:FNP8q5zsoFiWBmmQ@cluster0.1tlmpxp.mongodb.net/?retryWrites=true&w=majority',
    {
        useNewUrlParser: true,
        useUnifiedTopology: true
    })
    .then(() => console.log('Connexion à MongoDB réussie !'))
    .catch(() => console.log('Connexion à MongoDB échouée !'));

    
// ce qui permet de créer une application express 
const app = express();    

// CORS ( mécanisme de sécurité utilisé par les navigateurs web pour contrôler les requêtes HTTP)
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    next();
});


app.use(bodyParser.json());

app.use('/api/auth', userRoutes);
app.use('/api/sauces', sauceRoutes);

//On récupère le repertoire dans lequel s'éxécute notre server et y concaténer le répertoire images pour obtenir le chemin complet sur le disque
app.use('/images', express.static(path.join(__dirname, 'images')))


module.exports = app;
