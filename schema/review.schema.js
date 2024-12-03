const mongoose = require("mongoose")

const reviewSchema = new mongoose.Schema({
    userName: {
        type: String,
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    reviewDate: {
        type: Date,
        default: Date.now
    },
    userCity: {
        type: String,
        required: true
    },
    userImage: {
        type: String
    },
    reviewText: {
        type: String,
        required: true
    },
})

const Review = mongoose.model("Review", reviewSchema)
module.exports = Review
