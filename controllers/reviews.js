const Campground = require('../models/campground')
const Review = require('../models/review')


module.exports.createReview = async (req, res) => {

    const { id } = req.params;
    const campground = await Campground.findById(id);

    if (!campground) {
        req.flash('danger', 'CANNOT FIND that campground!');
        return res.redirect('/campgrounds');
    }

    const review = new Review(req.body);
    review.campground = id;
    review.author = req.user._id;
    campground.reviews.push(review);

    await review.save();
    await campground.save();
    req.flash('success', 'Successfully CREATED new review!');
    res.redirect(`/campgrounds/${id}`)

}

module.exports.deleteReview = async (req, res) => {

    const { id, reviewid } = req.params;
    await Campground.findByIdAndUpdate(id, { $pull: {reviews: reviewid} });

    await Review.findByIdAndDelete(reviewid);
    req.flash('success', 'Successfully DELETED review!');
    res.redirect(`/campgrounds/${id}`)
    
}
