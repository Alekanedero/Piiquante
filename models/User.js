const mongoose = require('mongoose');

// pour quil y est qu'une seul adresse email unique et pas 2 fois la même
const uniqueValidator = require('mongoose-unique-validator');

const userSchema = mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type : String, required: true}
});

// On applique notre validateur a notre shema
userSchema.plugin(uniqueValidator)

// puis on fait de notre schema un model
module.exports = mongoose.model('User', userSchema);