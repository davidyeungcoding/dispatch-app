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
  },
  refreshToken: {
    type: String,
    default: ''
  }
});

// ==============================
// || Schema and Model Exports ||
// ==============================

module.exports.userSchema = userSchema;
module.exports.userModel = new mongoose.model('User', userSchema);

// ======================
// || Shared Variables ||
// ======================

const normalExclude = { password: 0, refreshToken: 0 };

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

module.exports.addRefreshToken = (id, token, callback) => {
  this.userModel.findByIdAndUpdate({ _id: id }, { $set: { refreshToken: token } }, callback);
};

module.exports.clearRefreshToken = (id, callback) => {
  this.userModel.findByIdAndUpdate({ _id: id }, { $set: { refreshToken: '' } }, callback);
};

// ===============
// || Edit User ||
// ===============

module.exports.editUser = (id, update, callback) => {
  const options = { new: true };
  this.userModel.findByIdAndUpdate(id, update, options, callback);
};

module.exports.updateAccount = (username, update, callback) => {
  const options = { new: true };

  if (update.password) {
    bcrypt.genSalt(10, (err, salt) => {
      bcrypt.hash(update.password, salt, (err, hash) => {
        if (err) throw err;
        update.password = hash;
        this.userModel.findOneAndUpdate({ username: username }, { $set: update }, options, callback);
      });
    });
  } else this.userModel.findOneAndUpdate({ username: username }, { $set: update }, options, callback);
};

// =================
// || Search User ||
// =================

module.exports.refreshTokenSearch = (username, callback) => {
  this.userModel.aggregate([{ $match: { username: username } }, { $project: { refreshToken: 1 } }], callback);
};

module.exports.search = (type, term, callback) => {
  const query = { [`${type}`]: term };
  this.userModel.aggregate([{ $match: query }, { $project: normalExclude }], callback);
};

module.exports.getAll = callback => {
  this.userModel.aggregate([{ $match: {} }, { $project: normalExclude }], callback);
};
