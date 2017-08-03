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
  permanent: {
    type: Boolean,
    required: true
  }
})

const Bit = mongoose.model('Bit', bitSchema)

module.exports = Bit
