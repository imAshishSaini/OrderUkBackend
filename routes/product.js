const express = require("express")
const router = express.Router()
const Product = require("../schema/product.schema")

router.post("/add", async (req, res) => {
    const { category, name, description, price, image } = req.body

    try {
        const newProduct = new Product({
            category,
            name,
            description,
            price,
            image,
        })

        await newProduct.save()
        console.log("Product saved successfully", newProduct)

        res.status(201).json({ message: "Product saved successfully" })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Server error. Please try again." })
    }
})

router.get("/categories", async (req, res) => {
    try {
        const categories = await Product.distinct("category")
        res.status(200).json(categories)
    } catch (error) {
        console.error("Error fetching categories:", error)
        res.status(500).json({ message: "Failed to fetch categories." })
    }
})

router.get("/", async (req, res) => {
    const { category } = req.query

    try {
        const products = await Product.find({ category: new RegExp(`^${category}$`, "i") })
        res.status(200).json(products)
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Failed to fetch products. Please try again." })
    }
})


module.exports = router
