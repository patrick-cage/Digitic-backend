const asyncHandler = require("express-async-handler")
const Coupon = require("../models/couponModel")
const validateMongoDbId = require("../utils/validateMongodbId")

const createCoupon = asyncHandler (async (req,res) => {
    try {
        const newCoupon = await Coupon.create(req.body)
        res.json(newCoupon)
    } catch (error) {
        throw new Error(error)
    }
})

const getAllCoupons = asyncHandler (async (req,res) => {
    try {
        const coupons = await Coupon.find()
        res.json(coupons)
    } catch (error) {
        throw new Error(error)
    }
})

const updateCoupon = asyncHandler (async (req,res) => {
    const {id} = req.params;
    validateMongoDbId(id)
    try {
        const updatecoupon = await Coupon.findByIdAndUpdate(id, req.body, {new: true})
        res.json(updatecoupon)
    } catch (error) {
        throw new Error(error)
    }
})
const deleteCoupon = asyncHandler (async (req,res) => {
    const {id} = req.params;
    validateMongoDbId(id)
    try {
        const deleteCoupon = await Coupon.findByIdAndDelete(id)
        res.json(deleteCoupon)
    } catch (error) {
        throw new Error(error)
    }
})

module.exports = {createCoupon,updateCoupon,getAllCoupons,deleteCoupon};