const express = require('express')
const router = express.Router({ mergeParams: true })

const wrapAsync = require('../utils/wrapAsync')
const { isLoggedIn, validateReview, isReviewAuthor } = require('../middleware')
const review = require('../controllers/reviews')


router.route('/')
    .get((req, res) => { res.redirect(`/campgrounds/${req.params.id}`) })
    .post([ isLoggedIn, validateReview ], wrapAsync(review.createReview))

router.delete('/:reviewid', [ isLoggedIn, isReviewAuthor ], wrapAsync(review.deleteReview))

module.exports = router;