const mongoose = require("mongoose");

const restaurantSchema = new mongoose.Schema({
  restaurantName: {
    type: String,
    required: true,
  },
  image: {
    type: String, // Base64 encoded image string
    required: true,
  },
  categories: {
    type: [String], // Array of strings
    required: true,
  },
  creationDate: {
    type: Date,
    default: Date.now,
  },
});

const Restaurant = mongoose.model("Restaurant", restaurantSchema);
module.exports = Restaurant;
