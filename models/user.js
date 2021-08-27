const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// ============
// || Schema ||
// ============

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  accountType: {
    type: String,
    enum: ['admin', 'doctor', 'dispatch'],
    required: true
  },
  videoCall: {
    type: String,
    required: false
  }
});

// ==============================
// || Schema and Model Exports ||
// ==============================

module.exports.userSchema = userSchema;
module.exports.userModel = new mongoose.model('User', userSchema);

// =================
// || Create User ||
// =================

module.exports.createUser = (payload, callback) => {
  bcrypt.genSalt(10, (err, salt) => {
    bcrypt.hash(payload.password, salt, (err, hash) => {
      if (err) throw err;
      payload.password = hash;
      payload.save(callback);
    });
  });
};

// =======================
// || Authenticate User ||
// =======================

module.exports.authSearch = (username, callback) => {
  this.userModel.findOne({ username: username }, callback);
};

module.exports.comparePassword = (password, hash, callback) => {
  bcrypt.compare(password, hash, (err, _match) => {
    if (err) throw err;
    callback(null, _match);
  });
};

// ===============
// || Edit User ||
// ===============

module.exports.editUser = (id, update, callback) => {
  this.userModel.findByIdAndUpdate(id, update, callback);
};

// =================
// || Search User ||
// =================

module.exports.search = (type, term, callback) => {
  const query = { [`${type}`]: term };
  const fields = { password: 0 };
  console.log(query)
  this.userModel.aggregate([{ $match: query }, { $project: fields }], callback);
};
