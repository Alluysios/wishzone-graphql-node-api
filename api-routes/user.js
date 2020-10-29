const express = require('express');
const User = require('../models/User');
const { resizeUploadedImages, uploadImages } = require('../middleware/uploader');

const router = express.Router();

const { protect } = require('../middleware/auth');

// @route   GET /
// @desc    Get User Profile
// @access  Private
router.get('/', protect, async(req, res) => {
    // get user
    const user = await User.findById(req.user.id);

    // if there is no user return an error
    if(!user) return res.status(400).json({ errors: [{ msg: 'No user with that id found' }]});

    res.status(200).json({
        user
    });
});


// @route   PATCH /
// @desc    Update user profile
// @access  Private
router.put('/updateProfile', 
    protect,
    uploadImages,
    resizeUploadedImages,
    async(req, res) => {
    if(!req.body.image) req.body.image = 'default.jpg';
    // check if user updating for password
    if(req.body.password) res.status(401).json({ errors: { type: 'profile', err: [{ msg: 'Please go to update password. This is only for updating profile. '}] }});
    const checkEmail = await User.findOne({ email: req.body.email });
    if(checkEmail) {
        return res.status(400).json({ errors: { type: 'profile', err: [{ msg: 'Email already exist' }] }});
    }
    const user = await User.findOneAndUpdate({ email: req.user. email}, {
        firstname: req.body.firstname,
        lastname: req.body.lastname,
        email: req.body.email
    }, { returnOriginal: false });

    if(!user) res.status(401).json({ errors: { type: 'profile', err: [{ msg: 'No user with that id.' }] }});


    res.status(200).json({
        user
    });
});


// @route   PATCH /
// @desc    Update user profile
// @access  Private
router.patch('/changePassword', protect, async(req, res) => {
    const { currentPassword, newPassword, passwordConfirm } = req.body;
    
    const user = await User.findById(req.user.id).select('+password');

    // Check if current password is correct
    if(!await user.comparePassword(currentPassword, user.password)) return res.status(401).json({ errors: { type: 'password', err: [{ msg: 'Current password wrong' }]} });

    // Check if new password is same with passwordConfirm
    if(newPassword !== passwordConfirm) return res.status(401).json({ errors: { type: 'password', err: [{ msg: 'Password not the same' }]} });

    // Update Password to new one.
    user.password = newPassword;
    await user.save();

    user.password = undefined;

    res.status(200).json({
        user
    });
})

module.exports = router;