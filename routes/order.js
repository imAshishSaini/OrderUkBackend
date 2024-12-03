const express = require("express")
const router = express.Router()
const Order = require("../schema/order.schema")
const authMiddleware = require("../middlewares/auth")
const Product = require("../schema/product.schema")

router.post("/add", authMiddleware, async (req, res) => {
  const { productId, quantity } = req.body

  try {
    const userId = req.user.id

    if (!userId) {
      return res.status(401).json({ message: "User not authorized." })
    }

    let cart = await Order.findOne({ user: userId, isPaid: false })

    if (!cart) {
      cart = new Order({
        user: userId,
        items: [{ productId, quantity }],
        totalPrice: 0,
      })
    } else {
      const itemIndex = cart.items.findIndex((item) => item.productId.equals(productId))
      if (itemIndex > -1) {
        cart.items[itemIndex].quantity += quantity
      } else {
        cart.items.push({ productId, quantity })
      }
    }

    cart.totalPrice = await calculateTotalPrice(cart.items)

    console.log(cart)
    await cart.save()
    res.status(200).json(cart)
  } catch (error) {
    console.error("Error adding to cart:", error)
    res.status(500).json({ message: "Failed to add to cart." })
  }
})



router.get("/user-cart", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id
    const cart = await Order.findOne({ user: userId, isPaid: false }).populate("items.productId")

    if (!cart) {
      return res.status(404).json({ message: "Cart is empty" })
    }

    res.status(200).json(cart)
  } catch (error) {
    console.error("Error fetching cart:", error)
    res.status(500).json({ message: "Failed to fetch cart. Please try again." })
  }
})
router.get('/user-cart', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id
    const cart = await Order.findOne({ user: userId, isPaid: true }).populate('items.productId')

    if (!cart) {
      return res.status(404).json({ message: 'Order not found' })
    }

    const items = cart.items.map(item => ({
      name: item.productId.name,
      quantity: item.quantity,
    }))

    res.status(200).json({
      items,
      totalPrice: cart.totalPrice,
    })
  } catch (error) {
    console.error('Error fetching order:', error)
    res.status(500).json({ message: 'Failed to fetch order details.' })
  }
})

router.delete("/remove/:productId", authMiddleware, async (req, res) => {
  const { productId } = req.params
  const userId = req.user.id

  try {
    const cart = await Order.findOne({ user: userId, isPaid: false })

    if (!cart) {
      return res.status(404).json({ message: "Cart not found." })
    }

    cart.items = cart.items.filter((item) => !item.productId.equals(productId))

    cart.totalPrice = await calculateTotalPrice(cart.items)

    await cart.save()
    res.status(200).json(cart)
  } catch (error) {
    console.error("Error removing item:", error)
    res.status(500).json({ message: "Failed to remove item. Please try again." })
  }
})

router.get("/public/:userId", async (req, res) => {
  const { userId } = req.params

  try {
    const cart = await Order.findOne({ user: userId, isPaid: false }).populate("items.productId")

    if (!cart) {
      return res.status(404).json({ message: "No active cart found." })
    }

    res.status(200).json(cart)
  } catch (error) {
    console.error("Error fetching public cart:", error)
    res.status(500).json({ message: "Failed to fetch public cart." })
  }
})

router.put('/:orderId/pay', async (req, res) => {
  const { orderId } = req.params
  const { paymentMethod } = req.body

  try {
    const order = await Order.findById(orderId)

    if (!order) {
      return res.status(404).json({ message: 'Order not found' })
    }

    order.isPaid = true
    order.paymentMethod = paymentMethod

    order.items = order.items.map(item => ({
      productId: item.productId,
      quantity: item.quantity,
      name: item.productId.name,
      price: item.productId.price,
    }))

    await order.save()
    res.status(200).json({ message: 'Order successfully paid', order })
  } catch (error) {
    console.error('Error processing payment:', error)
    res.status(500).json({ message: 'An error occurred while processing the payment' })
  }
})

router.get('/:cartId', async (req, res) => {
  console.log(req.params)
  const { cartId } = req.params;
  console.log(cartId)

  try {
    console.log(cartId)
    const cart = await Order.findById(cartId).populate('items.productId');

    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    const items = cart.items.map(item => ({
      name: item.productId.name,
      quantity: item.quantity,
    }));

    res.status(200).json({ items, totalPrice: cart.totalPrice });
  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).json({ message: 'Failed to fetch cart details.' });
  }
});


router.get('/public', authMiddleware, async (req, res) => {
  const userId = req.user.id
  console.log(userId)

  try {
    const cart = await Order.findOne({ user: userId, isPaid: false }).populate('items.productId')

    if (!cart) {
      return res.status(404).json({ message: 'Cart not found.' })
    }

    const link = `${req.protocol}://${req.get('host')}/cart/${userId}`

    res.status(200).json({ link })
  } catch (error) {
    console.error('Error generating cart link:', error)
    res.status(500).json({ message: 'Failed to generate shareable link.' })
  }
})


router.put('/public/:userId', authMiddleware, async (req, res) => {
  const { userId } = req.params
  const { productId, quantity } = req.body

  try {
    const cart = await Order.findOne({ user: userId, isPaid: false }).populate('items.productId')

    if (!cart) {
      return res.status(404).json({ message: 'Shared cart not found.' })
    }

    const itemIndex = cart.items.findIndex(item => item.productId.equals(productId))
    if (itemIndex > -1) {
      cart.items[itemIndex].quantity = quantity
    } else {
      cart.items.push({ productId, quantity })
    }

    cart.totalPrice = await calculateTotalPrice(cart.items)
    await cart.save()

    res.status(200).json(cart)
  } catch (error) {
    console.error("Error editing shared cart:", error)
    res.status(500).json({ message: "Failed to edit cart." })
  }
})




const calculateTotalPrice = async (items) => {
  let totalPrice = 0

  for (const item of items) {
    const product = await Product.findById(item.productId)
    if (product) {
      totalPrice += product.price * item.quantity
    }
  }

  return totalPrice
}


module.exports = router
