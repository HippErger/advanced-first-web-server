import express from 'express';
import User from '../models/UserModel';
import passport from 'passport';
// import the controller when we have that cleaned up
// import AuthenticationController from '../controllers/AuthenticationController';
import bcrypt from 'bcrypt';
import jwt from 'jwt-simple';
require('../services/passport');

const router = express.Router();
const signInStrategy = passport.authenticate('signInStrategy', {session: false});
const USERS_PATH = '/users';

// This is the request in postman that gets us here
// http://localhost:3000/users/signup
// add next() to the arguments in this controller
function tokenForUser(user) {
  const timeStamp = new Date().getTime();
  console.log(process.env.SECRET);
  return jwt.encode({userId: user.id, iat: timeStamp}, process.env.SECRET);
}
// process.env.SECRET

router.post(USERS_PATH + '/signin', signInStrategy, (request, response) => {
  return response.json({token: tokenForUser(request.user)});
});

router.post(USERS_PATH + '/signup', (request, response, next) => {
  const {username, password} = request.body;

  if (!username || !password) {
    // add this is returning if either is undefined!
    return response.status(422).json({Error: 'Must provide a username and password'});
  }
  // will need to figure out the searching portion of this controller later
  User.findOne({username}).exec()
    .then((existingUsername) => {
      if (existingUsername) {
        console.log('stuck looking for one.');
        return response.status(422).json({ error: 'Username is already in use.'});
      }
      bcrypt.hash(password, 10, function (err, hashedPassword) {
        if (err) {
          return next(err);
        }
        const user = new User({username, password: hashedPassword});

        user.save()
          // (user => response.json(user))
          // need to return response.json({token: tokenForUser(user)});
          .then(response.json({token: tokenForUser(user)}));
      })
    .catch(err => next(err));
    });
});

export default router;
