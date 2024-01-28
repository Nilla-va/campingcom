
const Campground = require('./models/campground')
const Review = require('./models/review')
const { campgroundSchema, reviewSchema, userSchema } = require('./validationSchemas')   // joi스키마
const ExpressError = require('./utils/ExpressError')

module.exports.isLoggedIn = (req, res, next) => {
    
    if (!req.isAuthenticated()) {
        req.session.returnTo = req.originalUrl;
        req.flash('danger', 'You must be signed in!');
        return res.redirect('/login')
    }
    next();
}

module.exports.storeReturnTo = (req, res, next) => {

    if (req.session.returnTo) {
        res.locals.returnTo = req.session.returnTo;
    }
    next();
}

// User joi유효성검사
module.exports.validateUser = (req, res, next) => {

    const { error } = userSchema.validate(req.body);
    if (error) {
        const msg = error.details.map(obj => obj.message).join(', ');
        throw new ExpressError(400, msg);
    } else {
        return next();
    }
}

// Campground joi유효성검사
module.exports.validateCampground = (req, res, next) => {   

    const { error } = campgroundSchema.validate(req.body);
    if (error) {
        const msg = error.details.map(obj => obj.message).join(', ');
        throw new ExpressError(400, msg);
    } else {
        return next(); 
    }
}

// campground작성자 본인확인
module.exports.isAuthor = async (req, res, next) => {   

    const { id } = req.params;
    const campground = await Campground.findById(id);

    if (!campground.author.equals(req.user._id)) {
        req.flash('danger', 'You do NOT have PERMISSION!');
        return res.redirect(`/campgrounds/${id}`);
    }

    next();
}

// Review joi유효성검사
module.exports.validateReview = (req, res, next) => {

    const { error } = reviewSchema.validate(req.body);
    if (error) {
        const msg = error.details.map(obj => obj.message).join(', ');
        throw new ExpressError(400, msg);
    } else {
        return next();
    }
}

// review작성자 본인확인
module.exports.isReviewAuthor = async (req, res, next) => {   

    const { id, reviewid } = req.params;
    const review = await Review.findById(reviewid);

    if (!review.author.equals(req.user._id)) {
        req.flash('danger', 'You do NOT have PERMISSION to do that!');
        return res.redirect(`/campgrounds/${id}`);
    }

    next();
}