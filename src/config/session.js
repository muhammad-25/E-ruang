const session = require('express-session');

const sessionOptions = {
  name: 'connect.sid',
  secret: process.env.SESSION_SECRET || 'rahasia_development',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24,
    httpOnly: true,
  },
};

const sessionMiddleware = session(sessionOptions);

module.exports = {
  sessionOptions,
  sessionMiddleware,
};
