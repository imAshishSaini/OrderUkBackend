const express = require("express")
const router = express.Router()
const Review = require("../schema/review.schema")

router.post("/add", async (req, res) => {
    const { userName, rating, userCity, userImage, reviewText } = req.body

    try {
        const newReview = new Review({
            userName,
            rating,
            userCity,
            userImage,
            reviewText,
        })

        await newReview.save()
        res.status(201).json({ message: "Review added successfully" })
    } catch (error) {
        console.error("Error adding review:", error)
        res.status(500).json({ message: "Failed to add review. Please try again." })
    }
})

router.get("/", async (req, res) => {
    try {
        const reviews = await Review.find().sort({ reviewDate: -1 })
        res.status(200).json(reviews)
    } catch (error) {
        console.error("Error fetching reviews:", error)
        res.status(500).json({ message: "Failed to fetch reviews. Please try again." })
    }
})

module.exports = router
