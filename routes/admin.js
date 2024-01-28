const express = require('express')
const router = express.Router()


router.get('/topsecret', (req, res) => {
    res.send('THIS IS TOP SECRET')
})

router.get('/deleteeverything', (req, res) => {
    res.send('DELETE EVERYTHING')
})

module.exports = router;