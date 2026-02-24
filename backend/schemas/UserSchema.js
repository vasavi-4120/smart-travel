const { Schema } = require("mongoose");
const bcrypt = require("bcryptjs");

const MOBILE_REGEX = /^[0-9]{10}$/;

const UserSchema = new Schema({
  email: {
    type: String,
    required: [true, "Your email address is required"],
    unique: true,
  },
  username: {
    type: String,
    required: [true, "Your username is required"],
  },
  password: {
    type: String,
    required: [true, "Your password is required"],
  },
  contact: {
    type: String,
    required: true,
    match: [MOBILE_REGEX, "Mobile number must be 10 digits (no country code)."],
  },
  address: {
    type: String,
    required: [true, "Your address is required"],
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  verificationToken: String,
  profileImage: {
    url: {
      type: String,
      default: "",
    },
    public_id: {
      type: String,
      default: "",
    },
  },

  createdAt: {
    type: Date,
    default: new Date(),
  },
});

UserSchema.pre("save", async function () {
  if (!this.isModified("password")) return; // skip if unchanged
  this.password = await bcrypt.hash(this.password, 12);
});

// // Optional: method to compare passwords
// // UserSchema.methods.comparePassword = async function (candidatePassword) {
// //   return bcrypt.compare(candidatePassword, this.password);
// // };

module.exports = { UserSchema };
