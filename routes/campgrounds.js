const multer = require('multer')
const { storage } = require('../cloudinary')
const upload = multer({ storage, limits: { files: 5, fileSize: 1024*1024*5 } })

const express = require('express')
const router = express.Router()

const wrapAsync = require('../utils/wrapAsync')
const { isLoggedIn, validateCampground, isAuthor } = require('../middleware')
const campgrounds = require('../controllers/campgrounds')


router.route('/')
    .get(wrapAsync(campgrounds.indexCamps))
    .post([ isLoggedIn, upload.array('campground[image]'), validateCampground ], wrapAsync(campgrounds.createCamp))

router.get('/loadmore/:offset', wrapAsync(campgrounds.loadMoreCamps))

router.get('/new', isLoggedIn, campgrounds.createCampForm)

router.route('/:id')
    .get(wrapAsync(campgrounds.showCamp))
    .put([ isLoggedIn, isAuthor, validateCampground ], wrapAsync(campgrounds.editCamp))
    .delete([ isLoggedIn, isAuthor ], wrapAsync(campgrounds.deleteCamp))

router.get('/:id/loadmore/:offset', wrapAsync(campgrounds.loadMoreReviews))

router.get('/:id/edit', [ isLoggedIn, isAuthor ], wrapAsync(campgrounds.editCampForm))

router.route('/:id/images')
    .get([ isLoggedIn, isAuthor ], wrapAsync(campgrounds.updateImagesForm))
    .put([ isLoggedIn, isAuthor, upload.array('image')], wrapAsync(campgrounds.updateImages))

module.exports = router;