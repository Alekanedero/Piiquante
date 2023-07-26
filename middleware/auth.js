
const jwt = require('jsonwebtoken');
 
module.exports = (req, res, next) => {
   try {
       const token = req.headers.authorization.split(' ')[1];  // récupéré le token en enlevant le bearer
       const decodedToken = jwt.verify(token, 'RANDOM_TOKEN_SECRET');  // décoder le token
       const userId = decodedToken.userId;  // récupère userId
       
       // on rajoute cette valeur a l'objet request qui lui est transmit aux route qui vont être appeler par la suite
       req.auth = {   
           userId: userId
       };
	next();
   } catch(error) {
       res.status(403).json({ message: 'unauthorized request'});
   }
};
