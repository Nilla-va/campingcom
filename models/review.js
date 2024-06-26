const mongoose = require('mongoose')
const { Schema } = mongoose


const reviewSchema = new Schema({
    body: String,
    rating: Number,
    campground: Schema.Types.ObjectId,
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
})

module.exports = mongoose.model('Review', reviewSchema)