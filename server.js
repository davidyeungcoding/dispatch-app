const express = require('express');
const path = require('path');
const bodyparser = require('body-parser');
const cors = require('cors');
const passport = require('passport');
const mongoose = require('mongoose');
const config = require('./config/database');

const app = express();
const port = 3000;

// ===================
// || DB Connection ||
// ===================

mongoose.connect(config.database, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

mongoose.connection.on('connected', () => {
  console.log(`Connected to Database: ${config.database}`);
});

mongoose.connection.on('error', err => {
  console.log(`Database Error: ${err}`);
});

// ================
// || Middleware ||
// ================

app.use(cors());
app.use(express.static(path.join(__dirname, 'src')));
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({
  extended: false
}));
app.use(passport.initialize());
app.use(passport.session());
require('./config/passport')(passport);

// =======================
// || DB Request Routes ||
// =======================

const users = require('./routes/users');

app.use('/users', users);

app.listen(port, () => {
  console.log(`Server started on port: ${port}`);
});
