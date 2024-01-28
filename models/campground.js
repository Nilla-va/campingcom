const mongoose = require('mongoose')
const Schema = mongoose.Schema

const Review = require('./review') 


const imageSchema = new Schema({     // 가상필드는 스키마에만 추가할수있으므로 따로 빼서 정의함.
    url: String,
    filename: String
})
// https://res.cloudinary.com/dldtukwsp/image/upload/v1705592468/Campgrounds/onayqr59qkqgn26eqxiw 를
// https://res.cloudinary.com/dldtukwsp/image/upload/c_fill,h_600,w_800/v1705592468/Campgrounds/onayqr59qkqgn26eqxiw 로 바꿔
// 이미지요청시 800x600 사이즈에 fill 적용된 형태로 받으려고
// 저 스키마에 urlResized라는 가상 필드를 추가하고 있는거임.
imageSchema.virtual('urlResized800x600').get(function () {
    return this.url.replace('/upload', '/upload/c_fill,h_600,w_800');
})
imageSchema.virtual('urlResized800x800').get(function () {
    return this.url.replace('/upload', '/upload/c_fill,h_800,w_800');
})

const campgroundSchema = new Schema ({
    title: String,
    images: [imageSchema],
    price: Number,
    description: String,
    location: String,
    geometry: {
        type: {
            type: String,
            enum: ['Point'],
        },
        coordinates: {
            type: [Number],
        }
    },
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    reviews: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Review'
        }
    ],
})

campgroundSchema.post('findOneAndDelete', async function (campground) {
    if (campground.reviews.length) { 
        await Review.deleteMany( { _id: {$in: campground.reviews} } )
    }
})

module.exports = mongoose.model('Campground', campgroundSchema)