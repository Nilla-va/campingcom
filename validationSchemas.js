const BaseJoi = require('joi')
const sanitizeHTML = require('sanitize-html')

const extension = (joi) => ({
    type: 'string',
    base: joi.string(),
    messages: {
        'string.escapeHTML': '{{#label}} must not include HTML!'
    },
    rules: {
        escapeHTML: {
            validate(value, helpers) {
                const clean = sanitizeHTML(value, {
                    allowedTags: [],
                    allowedAttributes: {},
                })
                if (clean !== value) return helpers.error('string.escapeHTML', { value })
                return clean;
            }
        }
    }
})
const Joi = BaseJoi.extend(extension)

module.exports.campgroundSchema = Joi.object({ 
    campground: Joi.object({
        title: Joi.string().max(50).required().escapeHTML(),
        location: Joi.string().required().escapeHTML(),
        // image: Joi.string().required(),
        price: Joi.number().required().min(0),
        description: Joi.string().max(1000).required().escapeHTML()
    }).required()
})

module.exports.reviewSchema = Joi.object({
    body: Joi.string().max(500).required().escapeHTML(),
    rating: Joi.number().required().min(1).max(5)
})

module.exports.userSchema = Joi.object({
    user: Joi.object({
        username: Joi.string().min(2).max(15).required().escapeHTML(),
        email: Joi.string().max(50).email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } }).required().escapeHTML(),
        password: Joi.string().pattern(new RegExp('^[a-zA-Z0-9!@#$%^&*()_+{}|":<>?~`\\-]{8,30}$')).required()
    })
})
