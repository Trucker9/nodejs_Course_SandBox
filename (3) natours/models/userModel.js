const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please tell us your name!'],
  },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    lowercase: true,
    // Using isEmail on this property.
    validate: [validator.isEmail, 'Please provide a valid email'],
  },
  photo: String,
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 8,
    // Never can be seen in results of Queries.
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      // Each time a user is being created, this callback function will be called and will compare two passwords.
      // This only works on CREATE and SAVE!!! (not update!)
      validator: function (el) {
        return el === this.password;
      },
      message: 'Passwords are not the same!',
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

// Right before saving the password we encrypt it.
userSchema.pre('save', async function (next) {
  // Only run this function if password was actually modified
  if (!this.isModified('password')) {
    return;
    next();
  }

  // Hash the password with cost of 12
  // this-> current document that is being saved.
  this.password = await bcrypt.hash(this.password, 12);

  // Delete passwordConfirm field (We used passwordConfirm to verify input password,  now we dont need to save it to DB.)
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre('save', function (next) {
    // IF password property has been modified OR IF document is being created right now, return.
  if (!this.isModified('password') || this.isNew) return next();
  // After this, 
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

// Query middleware: when using any type of find method, find results that "active" = "true"
userSchema.pre(/^find/, function (next) {
  // this keyword points to the current query
  this.find({ active: { $ne: false } });
  next();
});

// Here we are adding a method to schema to check for password.
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  // Comparing encrypted passwords with compare();
  // NOTE: this.password() wont be available because it has "select:false". even though that "this" refers to the current document.
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  // if passwordChangedAt is not defined, then user has not changed its password after JWTTimestamp and we return.
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );

    return JWTTimestamp < changedTimestamp;
  }

  // False means NOT changed
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  // This token acts like a password that can be used one to grant access to protected routes. so we should not save in DB as plain text.
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  console.log({ resetToken }, this.passwordResetToken);
  // 10 minutes limit. We are just adding it to the current document not saving it in DB(current document is the result of User.findOne(); )
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  // We saved the encrypted version of the token to the DB(for later comparison), and here we return the token itself.
  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
