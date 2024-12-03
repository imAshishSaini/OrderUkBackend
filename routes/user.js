const express = require("express")
const router = express.Router()
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const User = require("../schema/user.schema")
const dotenv = require('dotenv')
const authMiddleware = require("../middlewares/auth")
dotenv.config()

router.post("/register", async (req, res) => {
  const { name, email, password, phoneNumber, gender, country } = req.body

  try {
    const userExists = await User.findOne({ email })
    if (userExists) {
      return res.status(400).json({ message: "User already exists" })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = new User({
      name,
      email,
      password: hashedPassword,
      phoneNumber,
      gender,
      country,
    })

    await user.save()

    res.status(201).send({ message: "User registered successfully" })
  } catch (error) {
    res.status(500).send({ message: "Server error. Please try again.", error })
  }
})

router.post("/login", async (req, res) => {
  const { email, password } = req.body

  try {
    console.log(email, password)
    const user = await User.findOne({ email })
    if (!user) {
      console.log(user)
      return res.status(401).send({ message: "Invalid email or password" })
    }


    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      return res.status(401).send({ message: "Invalid email or password" })
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" })

    res.status(200).json({ token })
  } catch (error) {
    res.status(500).send({ message: "Server error. Please try again.", error })
  }
})

router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('name email gender country')
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }
    res.status(200).json(user)
  } catch (error) {
    res.status(500).json({ message: 'Server error', error })
  }
})

router.put('/profile', authMiddleware, async (req, res) => {
  const { name, gender, email, country } = req.body

  try {
    const emailExists = await User.findOne({ email, _id: { $ne: req.user.id } })
    if (emailExists) {
      return res.status(400).json({ message: 'Email already in use' })
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { name, gender, email, country },
      { new: true }
    )

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' })
    }

    res.status(200).json({ message: 'Profile updated successfully', user: updatedUser })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error })
  }
})

router.post('/payment-methods', authMiddleware, async (req, res) => {
  const { cardNumber, name, expiryDate, cvv } = req.body

  if (!cardNumber || cardNumber.length !== 16) {
    return res.status(400).json({ message: 'Invalid card number' })
  }
  if (!expiryDate || !/^\d{2}\/\d{2}$/.test(expiryDate)) {
    return res.status(400).json({ message: 'Invalid expiry date format. Use MM/YY.' })
  }
  if (!cvv || cvv.length !== 3) {
    return res.status(400).json({ message: 'Invalid CVV' })
  }

  try {
    const user = await User.findById(req.user.id)
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    const maskedCardNumber = `XXXX XXXX XXXX ${cardNumber.slice(-4)}`
    const newPaymentMethod = { cardNumber: maskedCardNumber, name, expiryDate, cvv }

    user.paymentMethods.push(newPaymentMethod)
    await user.save()

    res.status(201).json({
      message: 'Payment method added successfully',
      paymentMethods: user.paymentMethods
    })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error })
  }
})

router.get('/payment-methods', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('paymentMethods')
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    const maskedMethods = user.paymentMethods.map((method) => ({
      id: method._id,
      name: method.name,
      cardNumber: method.cardNumber,
      expiryDate: method.expiryDate,
    }))

    res.status(200).json(maskedMethods)
  } catch (error) {
    res.status(500).json({ message: 'Server error', error })
  }
})

router.put('/payment-methods/:id', authMiddleware, async (req, res) => {
  const { cardNumber, name, expiryDate, cvv } = req.body

  if (cardNumber && cardNumber.length !== 16) {
    return res.status(400).json({ message: 'Invalid card number' })
  }
  if (expiryDate && !/^\d{2}\/\d{2}$/.test(expiryDate)) {
    return res.status(400).json({ message: 'Invalid expiry date format. Use MM/YY.' })
  }
  if (cvv && cvv.length !== 3) {
    return res.status(400).json({ message: 'Invalid CVV' })
  }

  try {
    const user = await User.findById(req.user.id)
    const method = user.paymentMethods.id(req.params.id)

    if (!method) {
      return res.status(404).json({ message: 'Payment method not found' })
    }

    if (cardNumber) {
      method.cardNumber = `XXXX XXXX XXXX ${cardNumber.slice(-4)}`
    }
    if (name) {
      method.name = name
    }
    if (expiryDate) {
      method.expiryDate = expiryDate
    }
    if (cvv) {
      method.cvv = cvv
    }

    await user.save()

    res.status(200).json({
      message: 'Payment method updated successfully',
      paymentMethods: user.paymentMethods
    })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error })
  }
})

router.delete('/payment-methods/:id', authMiddleware, async (req, res) => {
  const { id } = req.params

  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $pull: { paymentMethods: { _id: id } } },
      { new: true }
    )

    if (!user) {
      return res.status(404).json({ message: 'Payment method not found' })
    }

    res.status(200).json({
      message: 'Payment method deleted successfully',
      paymentMethods: user.paymentMethods
    })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error })
  }
})

router.get('/verify', authMiddleware, async (req, res) => {
  res.status(200).json({ message: '' })
})

router.post('/address', authMiddleware, async (req, res) => {
  console.log(req.body)
  const { address, phone, district, state, pincode, default: isDefault } = req.body

  console.log("Received address data:", req.body)

  try {
    const user = await User.findById(req.user.id)
    if (!user) {
      console.log("User not found")
      return res.status(404).json({ message: 'User not found' })
    }

    if (isDefault) {
      user.Address.forEach((addr) => (addr.default = false))
    }

    const newAddress = { address, phone, district, state, pincode, default: isDefault || false }
    user.Address.push(newAddress)
    await user.save()

    res.status(201).json({ message: 'Address added successfully', address: newAddress })
  } catch (error) {
    console.error("Error while adding address:", error)
    res.status(500).json({ message: 'Server error', error })
  }
})



router.put('/address/:id', authMiddleware, async (req, res) => {
  const { address, phone, district, state, pincode, default: isDefault } = req.body

  try {
    const user = await User.findById(req.user.id)
    if (!user) return res.status(404).json({ message: 'User not found' })

    const addr = user.Address.id(req.params.id)
    console.log("Received address data:", req.body)
    if (!addr) return res.status(404).json({ message: 'Address not found' })

    if (isDefault) {
      user.Address.forEach((addr) => (addr.default = false))
    }

    addr.address = address || addr.address
    addr.phone = phone || addr.phone
    addr.district = district || addr.district
    addr.state = state || addr.state
    addr.pincode = pincode || addr.pincode
    addr.default = isDefault || addr.default
console.log("Updated address data:", addr)
    await user.save()

    res.status(200).json({ message: 'Address updated successfully', address: addr })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error })
  }
})


router.get('/address', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('Address')
    if (!user) return res.status(404).json({ message: 'User not found' })

    res.status(200).json(user.Address)
  } catch (error) {
    res.status(500).json({ message: 'Server error', error })
  }
})

router.delete('/address/:id', authMiddleware, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $pull: { Address: { _id: req.params.id } } },
      { new: true }
    )

    if (!user) return res.status(404).json({ message: 'Address not found' })

    res.status(200).json({ message: 'Address deleted successfully', addresses: user.Address })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error })
  }
})

router.get("/user-address", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id
    const user = await User.findById(userId).populate("Address")
    if (!user || user.Address.length === 0) {
      return res.status(404).json({ message: "No address found" })
    }

    const defaultAddress = user.Address.find(addr => addr.default) || user.Address[0]
    res.status(200).json({ defaultAddress })
  } catch (error) {
    console.error("Error fetching address:", error)
    res.status(500).json({ message: "Failed to fetch address" })
  }
})




module.exports = router
