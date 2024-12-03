const express = require("express");
const router = express.Router();
const Restaurant = require("../schema/restaurant.schema");

router.post("/add", async (req, res) => {
  const { restaurantName, image, categories } = req.body;

  if (!restaurantName || !image || !categories || categories.length === 0) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const restaurant = new Restaurant({ restaurantName, image, categories });
    await restaurant.save();

    res.status(201).json({ message: "Restaurant added successfully", restaurant });
  } catch (error) {
    console.error("Error adding restaurant:", error);
    res.status(500).json({ message: "Server error", error });
  }
});

router.get("/list", async (req, res) => {
    try {
      const restaurants = await Restaurant.find().select("restaurantName image categories");
      res.status(200).json(restaurants);
    } catch (error) {
      console.error("Error fetching restaurants:", error);
      res.status(500).json({ message: "Server error", error });
    }
  })

  router.get("/:restaurantId/productCategories", async (req, res) => {
    const { restaurantId } = req.params;
  
    try {
      const restaurant = await Restaurant.findById(restaurantId).select("categories");
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }
      res.status(200).json(restaurant.categories);
    } catch (error) {
      console.error("Error fetching restaurant categories:", error);
      res.status(500).json({ message: "Server error", error });
    }
  });
  
  

module.exports = router;
