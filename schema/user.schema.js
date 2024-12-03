const mongoose = require("mongoose")

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  phoneNumber: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  gender: {
    type: String,
    enum: ["Male", "Female", "Other"],
  },
  country: {
    type: String,
    required: false,
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
  paymentMethods: [
    {
      cardNumber: { type: String, required: true },
      name: { type: String, required: true },
      expiryDate: { type: String, required: true },
      cvv: { type: String},
    },
  ],
  Address: [
    {
      address: { type: String, required: true },
      phone: { type: String, required: true },
      district: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true },
      default: { type: Boolean, default: false },
    },
  ],
  
  creationDate: {
    type: Date,
    default: Date.now,
  },
})

const User = mongoose.model("User", userSchema)
module.exports = User
