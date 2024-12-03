const express = require('express')
const mongoose = require('mongoose')
const dotenv = require('dotenv')
const bodyParser = require('body-parser')
const userRouter = require('./routes/user')
const productRouter = require('./routes/product')
const reviewRouter = require('./routes/review')
const cartRouter = require('./routes/order')
const restaurantRouter = require('./routes/restaurant')

dotenv.config()
const app = express()
const cors = require('cors')

app.use(cors())

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

app.use('/api/user', userRouter)
app.use('/api/product', productRouter)
app.use('/api/review', reviewRouter)
app.use('/api/cart', cartRouter)
app.use('/api/restaurant', restaurantRouter)

mongoose.connect(process.env.MONGOOSE_URI_STRING, {})
  .then(() => console.log('Connected to database'))
  .catch((err) => console.log('Error connecting to database', err))


app.listen(process.env.PORT || 8000, () => console.log('Server started on port', process.env.PORT || 8000))