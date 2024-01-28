const mapboxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const geocodingClient = mapboxGeocoding({ accessToken: process.env.MAPBOX_TOKEN });

const Campground = require('../models/campground')
const Review = require('../models/review')
const { cloudinary } = require('../cloudinary');


module.exports.indexCamps = async (req, res) => {
    const campgrounds = await Campground.find().sort({ _id: -1 });

    let features = [];
    for (let camp of campgrounds) {

        await Review.aggregate([
            { $match: { campground: camp._id } }, 
            { $group: { _id: '$campground', avgRating: { $avg: '$rating' }, countReviews: { $count: {} } } }
        ])
        .then((result) => {

            features.push({
                "type": "Feature",
                "properties": { "id": camp._id, "title": camp.title, "location": camp.location, "price": camp.price, "avgRating": (result.length>0 ? result[0].avgRating : 0) },
                "geometry": { "type": "Point", "coordinates": [camp.geometry.coordinates[0], camp.geometry.coordinates[1], 0.0] }
            })

        }, (err) => {
            console.log(err)
            return res.redirect('/campgrounds')
        })

    }

    const mapData =
    {
        "type": "FeatureCollection",
        "crs": { "type": "name", "properties": { "name": "urn:ogc:def:crs:OGC:1.3:CRS84" } },
        "features": features
    };

    res.render('campgrounds/index', { campgrounds: campgrounds.slice(0, 5), mapData, currPage: 'index' });
}

module.exports.loadMoreCamps = async (req, res) => {
    const campgrounds = await Campground.find().sort({ _id: -1 });

    const offset = parseInt(req.params.offset);
    const nextCampgrounds = campgrounds.slice(offset, offset + 15);

    let isLastPage = (offset+15 < campgrounds.length) ? false : true;

    res.json({ nextCampgrounds, isLastPage });
}

module.exports.createCampForm = (req, res) => {
    res.render('campgrounds/new', { currPage: 'new' });
}

module.exports.createCamp = async (req, res) => {

    const campground = new Campground(req.body.campground);
    campground.author = req.user._id;
    campground.images = req.files.map((file) => ({ url: file.path, filename: file.filename }))

    await geocodingClient.forwardGeocode({ query: campground.location, limit: 1 })
    .send()
    .then(response => {
        const match = response.body;
        if (match.features.length === 0) {
            campground.geometry = { type: "Point", coordinates: [ 127.49655, 37.81415 ] };
        } else {
            campground.geometry = match.features[0].geometry;
        }
    });

    await campground.save();
    req.flash('success', 'Successfully MADE new campground!');
    res.redirect(`/campgrounds/${campground._id}`);

}

module.exports.showCamp = async (req, res) => {

    const campground = await Campground.findById(req.params.id)
        .populate('author')
    
    const reviews = await Review.find({ campground: campground._id }).sort({ _id: -1 })
        .populate('author', 'username')

    if (!campground) { 
        req.flash('danger', 'CANNOT FIND that campground!');
        return res.redirect('/campgrounds');
    }

    // 이 캠핑장 리뷰들의 평균별점
    await Review.aggregate([
        { $match: { campground: campground._id } }, 
        { $group: { _id: '$campground', avgRating: { $avg: '$rating' }, countReviews: { $count: {} } } }
    ])
    .then((result) => {
        console.log(campground, reviews);
        console.log(result);
        res.render('campgrounds/show', {
            campground,
            reviews: reviews.slice(0, 5),
            avgRating: (result.length>0 ? result[0].avgRating : 0),
            countReviews: (result.length>0 ? result[0].countReviews : 0)
        });
    }, (err) => {
        console.log(err)
        res.redirect('/campgrounds')
    })

}

module.exports.loadMoreReviews = async (req, res) => {

    const reviews = await Review.find({ campground: req.params.id }).sort({ _id: -1 })
        .populate('author', 'username')

    const currentUser = req.user

    const offset = parseInt(req.params.offset);
    const nextReviews = reviews.slice(offset, offset + 10);

    let isLastPage = (offset+10 < reviews.length) ? false : true;

    res.json({ nextReviews, currentUser, isLastPage });
}

module.exports.editCampForm = async (req, res) => {

    const campground = await Campground.findById(req.params.id);

    if (!campground) {
        req.flash('danger', 'CANNOT FIND that campground!');
        return res.redirect('/campgrounds');
    }

    res.render('campgrounds/edit', {campground});
}

module.exports.editCamp = async (req, res) => {

    const editedCampground = req.body.campground;
    await geocodingClient.forwardGeocode({ query: editedCampground.location, limit: 1 })
    .send()
    .then(response => {
        const match = response.body;
        if (match.features.length === 0) {
            editedCampground.geometry = { type: "Point", coordinates: [ 127.49655, 37.81415 ] };   // 검색실패시 디폴트좌표 - 경기도 가평군
        } else {
            editedCampground.geometry = match.features[0].geometry;
        }
    });

    const updatedCampground = await Campground.findByIdAndUpdate(req.params.id, editedCampground, {runValidators: true, returnDocument: 'after'});

    req.flash('success', 'Successfully UPDATED campground!');
    res.redirect(`/campgrounds/${updatedCampground._id}`);
}

module.exports.deleteCamp = async (req, res) => {

    await Campground.findByIdAndDelete(req.params.id);
    req.flash('success', 'Successfully DELETED campground!');
    res.redirect('/campgrounds');
}

module.exports.updateImagesForm = async (req, res) => {

    const campground = await Campground.findById(req.params.id);

    if (!campground) {
        req.flash('danger', 'CANNOT FIND that campground!');
        return res.redirect('/campgrounds');
    }

    res.render('campgrounds/edit-images', {campground});
}

module.exports.updateImages = async (req, res) => {

    // 이미지 추가
    const campground = await Campground.findById(req.params.id);
    const images = req.files.map(file => ({ url: file.path, filename: file.filename }));
    campground.images.push(...images);

    // 이미지 삭제
    if (req.body.imagesToDelete) {
        for (let filename of req.body.imagesToDelete) { cloudinary.uploader.destroy(filename); }
        campground.images = campground.images.filter(image => !(req.body.imagesToDelete.includes(image.filename)))
    }
    
    const updatedCampground = await Campground.findByIdAndUpdate(req.params.id, campground, {runValidators: true, returnDocument: 'after'});

    req.flash('success', 'Successfully UPDATED images!');
    res.redirect(`/campgrounds/${updatedCampground._id}`);
}