const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const User = require('../models/user');
const database = require('./database');

module.exports = passport => {
  let options = {};
  options.jwtFromRequest = ExtractJwt.fromAuthHeaderWithScheme('jwt');
  options.secretOrKey = database.secret;

  passport.use(new JwtStrategy(options, (jwt_payload, done) => {
    User.search('_id', jwt_payload.id, (err, _user) => {
      if (err) return done(err, false);
      return _user ? done(null, _user) : done(null, false);
    });
  }));
};
