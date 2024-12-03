const mongoose = require("mongoose")

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  items: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
        default: 1,
      },
    },
  ],
  totalPrice: {
    type: Number,
    required: true,
  },
  isPaid: {
    type: Boolean,
    default: false,
  },
  paidAt: {
    type: Date,
  },
  deliveryMethod: {
    type: String,
    enum: ["Door delivery", "Pick up"],
    default: "Door delivery",
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
})

const Order = mongoose.model("Order", orderSchema)
module.exports = Order
