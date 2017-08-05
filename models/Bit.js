const mongoose = require('mongoose')

const bitSchema = mongoose.Schema({
  _id: {
    type: String,
    required: true
  },
  text: {
    type: String,
    required: true
  },
  encrypted: {
    type: Boolean,
    required: true
  },
  hashedKey: {
    type: String,
    required: false
  },
  triesLeft: {
    type: Number,
    required: false
  },
  permanent: {
    type: Boolean,
    required: true
  }
})

const Bit = mongoose.model('Bit', bitSchema)

module.exports = Bit
