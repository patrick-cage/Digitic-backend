const User = require('../models/userModel')
const Product = require('../models/productModel')
const Cart = require('../models/cartModel')
const Coupon = require('../models/couponModel')
const Order = require('../models/orderModel')
const uniqid = require('uniqid')
const asyncHandler = require("express-async-handler")
const validateMongoDbId = require('../utils/validateMongodbId');
const { generateRefreshToken } = require('../config/refreshtoken');
const {generateToken} = require('../config/jwtToken')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const bcrypt = require('bcrypt');
const sendEmail = require('./emailCtrl');
//Create a User
const createUser = asyncHandler(async (req,res) => {
    const email = req.body.email;
    const findUser = await User.findOne({email:email});
    if(!findUser) {
        //Cretae a new user
      const newUser = await User.create(req.body)
      res.json(newUser);
    } else { 
        throw new Error('User Already Exists')
    }
})

//Login a user
const loginUserCtrl = asyncHandler(async (req,res) =>{
    const {email, password} = req.body;
   //check if user exists or not
   const findUser = await User.findOne({email});
   if(findUser && await findUser.isPasswordMatched(password)){
    const refreshToken = await generateRefreshToken(findUser?._id) 
    const updateuser = await User.findByIdAndUpdate(findUser.id, {
      refreshToken: refreshToken,
    },
    {new:true}) 
    res.cookie('refreshToken', refreshToken,{
      httpOnly: true,
      maxAge: 72*60*60*1000,
    })
    res.json({
        _id: findUser?._id,
        firstname: findUser?.firstname,
        lastname: findUser?.lastname,
        email: findUser?.email,
        mobile:findUser?.mobile,
        token: generateToken(findUser?._id),
      })
   }else {
    throw new Error("Invalid Credentials")
   }
})

//admin login
const loginAdmin = asyncHandler(async (req,res) =>{
  const {email, password} = req.body;
 //check if user exists or not
 const findAdmin = await User.findOne({email});
 if(findAdmin.role !== 'admin') throw new Error("Not Authorized")
 if(findAdmin && (await findAdmin.isPasswordMatched(password))){
  const refreshToken = await generateRefreshToken(findAdmin?._id) 
  const updateuser = await User.findByIdAndUpdate(findAdmin.id, {
    refreshToken: refreshToken,
  },
  {new:true}) 
  res.cookie('refreshToken', refreshToken,{
    httpOnly: true,
    maxAge: 72*60*60*1000,
  })
  res.json({
      _id: findAdmin?._id,
      firstname: findAdmin?.firstname,
      lastname: findAdmin?.lastname,
      email: findAdmin?.email,
      mobile:findAdmin?.mobile,
      token: generateToken(findAdmin?._id),
    })
 }else {
  throw new Error("Invalid Credentials")
 }
})

//handle refresh token 

const handleRefreshToken = asyncHandler(async (req, res) => {
const cookie = req.cookies;
console.log(cookie)
if(!cookie?.refreshToken) throw new Error('No Refresh Token in Cookies')
const refreshToken = cookie.refreshToken;
const user = await User.findOne({ refreshToken})
if(!user) throw new Error('No Refresh Token present in db or not matched')
 jwt.verify(refreshToken,process.env.JWT_SECRET, (err,decoded) =>{
  if(err || user.id !== decoded.id){
    throw new Error('There is something wrong with refresh token')
  }
  const accessToken = generateRefreshToken(user?._id)
  res.json({accessToken})
 })
})

//logout functionality
const logout = asyncHandler(async (req, res) => {
  const cookie = req.cookies;
  if (!cookie?.refreshToken) {
    throw new Error('No Refresh Token in Cookies');
  }
  const refreshToken = cookie.refreshToken;

  // Find the user by refreshToken and update it
  const user = await User.findOneAndUpdate(
    { refreshToken }, // Filter criteria
    { refreshToken: '' }, // Update to apply
    { new: true } // Options to return the updated document
  );

  if (!user) {
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: true,
    });
    return res.sendStatus(204); // Forbidden
  }

  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: true,
  });
  res.sendStatus(204); // Forbidden
});

//Update a user
const updatedUser = asyncHandler(async (req, res) => {
  console.log()
  const { _id } = req.user
  validateMongoDbId(_id)
  try {
    const updatedUser = await User.findByIdAndUpdate(_id, 
    {
      firstname: req?.body?.firstname,
      lastname: req?.body?.lastname,
      email: req?.body?.email,
      mobile: req?.body?.mobile,
    },
    {
      new: true,
    }
    )
    res.json(updatedUser)
  } catch (error) {
    throw new Error(error)
  }
})

//Save User Address
const saveAddress = asyncHandler(async (req,res)=>{
  const {_id} = req.user;
  validateMongoDbId(_id)
  try {
    const updatedUser = await User.findByIdAndUpdate(_id, 
    {
      address: req?.body?.address,
      
    },
    {
      new: true,
    }
    )
    res.json(updatedUser)
  } catch (error) {
    throw new Error(error)
  }
})
//Get All Users

const getallUser = asyncHandler(async (req,res)=>{
  try {
     const getUsers = await User.find() 
     res.json(getUsers)
  } catch (error) {
    throw new Error(error)
  }
 
})

//Get a single user

const getaUser = asyncHandler(async(req,res)=>{
  const {id} = req.params
  validateMongoDbId(id)

  try {
    const getaUser = await User.findById( id )
    res.json({
      getaUser
    })
  } catch (error) {
    throw new Error(error)
  }
})

//delete a user

const deleteaUser = asyncHandler(async(req,res)=>{
 
  const {id} = req.params
  validateMongoDbId(id)

  try {
    const deleteaUser = await User.findByIdAndDelete( id )
    res.json({
      deleteaUser,
    })
  } catch (error) {
    throw new Error(error)
  }
})

const blockUser = asyncHandler(async(req, res) => {
  const {id} = req.params;
  validateMongoDbId(id)

  try {
    const blockusr = await User.findByIdAndUpdate(id, 
    {
      isBlocked:true,
    },
    {
      new: true,   
    }
    )
    res.json({
      message: "User Blocked",
    })
  } catch (error) {
    throw new Error(error)
  }
})
const unblockUser = asyncHandler(async(req, res) => {
  const {id} = req.params;
  validateMongoDbId(id)
  try {
    const unblock = await User.findByIdAndUpdate(id, 
    {
      isBlocked:false,
    },
    {
      new: true,   
    } 
    )
    res.json({
      message: "User Unblocked",
    })
  } catch (error) {
    throw new Error(error)
  }

})
//test//
// const updatePassword = asyncHandler(async (req, res) => {
//   const { _id } = req.user;
//   const newPassword = req.body.password;
//   validateMongoDbId(_id);

//   try {
//     const user = await User.findById(_id);

//     if (newPassword) {
//       user.password = newPassword;
//       const salt = await bcrypt.genSaltSync(10);
//       user.password = await bcrypt.hash(newPassword, salt);
//       const updatedPassword = await user.save();
//       res.json(updatedPassword);
//     } else {
//       res.json(user);
//     }
//   } catch (error) {
//     throw new Error(error);
//   }
// });

//end of test//
const updatePassword = asyncHandler(async (req,res) =>{
      const { _id } = req.user;
      const {password} = req.body;
    //  console.log(req.user)
      validateMongoDbId(_id);
      const user = await User.findById(_id);
      if (password) {
        user.password = password;
        console.log(password)
        const updatedPassword = await user.save()
          res.json(updatedPassword)
      } else {
        res.json(user)
      }
})

const forgotpasswordToken = asyncHandler(async (req,res) =>{
  const {email} = req.body;
  const  user = await User.findOne({ email});
  if(!user) throw new Error("User not found with this email");
  try {
    const token = await user.createPasswordResetToken();
    await user.save();
    const resetURL = `Hi, Please follow this link to reset your Password.This link is valid till 10 minutes from now. <a href='http://localhost:5000/api/user/reset-password/${token}'>Click Here</a>`
     const data = {
      to: email,
      text: "Hey User",
      subject: "Forgot Password link",
      htm: resetURL,
     } 
     sendEmail(data);
     res.json(token);
  } catch (error) {
    throw new Error(error)
  }
 
})
const  resetPassword = asyncHandler(async (req, res) => {
  const {password} = req.body;
  const {token} = req.params;
  const hashedPassword  = crypto.createHash('sha256').update(token).digest("hex")
  const user = await User.findOne({
    passwordResetToken: hashedPassword,
    passwordResetExpires: {$gt: Date.now()}
  })
  if(!user) throw new Error("Token Expired, Please try again later")
  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  res.json(user)

})

const getWishlist = asyncHandler(async(req, res) => {
  const { _id } = req.user;
  try {
    const findUser = await User.findById(_id).populate("wishlist")
    res.json(findUser)
  } catch (error) {
    throw new Error(error)
  }
})

// const userCart = asyncHandler(async(req, res) => {
//        const { cart } = req.body;
//        const { _id } = req.user;
//        validateMongoDbId(_id)
//        try {
//         let products = []
//           const user = await User.findById(_id)
//           //check if user already have products in cart
//           const alreadyExistCart = await Cart.findOne({orderby: user._id})
//           if(alreadyExistCart) {
//             alreadyExistCart.remove();
//           }
//           for (let i = 0; i < cart.length; i++) {
//             let object = {};
//             object.product = cart[i]._id;
//             object.count = cart[i].count;
//             object.color = cart[i].color;
//             let getPrice = await Product.findById(cart[i]._id).select("price").exec();
//             object.price = getPrice.price;
//             products.push(object);
//           }
//           console.log(products)
//        } catch (error) {
//         throw new Error(error)
//        }
// })
//gpt userCart
const userCart = asyncHandler(async (req, res) => {
  try {
    // Ensure that user authentication is working as expected.
    if (!req.user || !req.user._id) {
      throw new Error('User is not authenticated or _id is missing.');
    }

    // Retrieve the user's _id.
    const { _id } = req.user;

    // Validate the _id.
    validateMongoDbId(_id);

    // Destructure the cart from the request body.
    const { cart } = req.body;

    let products = [];

    // Find the user by _id.
    const user = await User.findById(_id);

    // Check if the user already has products in the cart.
    const alreadyExistCart = await Cart.findOne({ orderby: user._id.toString() }); // Convert to string here.

    if (alreadyExistCart) {
      // Remove the existing cart if needed.
      alreadyExistCart.remove();
    }

    // Iterate through the cart items.
    for (let i = 0; i < cart.length; i++) {
      let object = {};
      object.product = cart[i]._id;
      object.count = cart[i].count;
      object.color = cart[i].color;

      // Fetch the product's price.
      let getPrice = await Product.findById(cart[i]._id).select('price').exec();
     
      //handle error if cart with the queried id dont exist or if the product is not found in the database.
      if (!getPrice) {
        throw new Error(`Product with ID ${cart[i]._id} not found`);
      }

      object.price = getPrice.price;
      products.push(object);
    }

    let cartTotal = 0;
    for (let i = 0; i < products.length; i++) {
      cartTotal = cartTotal + products[i].price * products[i].count;
    }

    let newCart = await new Cart({
      products,
      cartTotal,
      orderby: user._id.toString(), // Convert to string here.
    }).save();
    res.json(newCart);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while processing the cart.' });
  }
});

const getUserCart = asyncHandler(async(req,res) => {
    const {_id} = req.user;
    validateMongoDbId(_id);
   try {
    const  cart = await Cart.findOne({orderby: _id}).populate(
      "products.product"
    )
    res.json(cart)
   } catch (error) {
    throw new Error(error)
   }
})

const emptycart = asyncHandler(async(req,res) => {
  const {_id} = req.user;
    validateMongoDbId(_id);
   try {
    const  user = await User.findOne({_id});
    const cart = await Cart.findOneAndRemove({orderby: user._id})
    res.json(cart)
   } catch (error) {
    throw new Error(error)
   }
})

// const applyCoupon = asyncHandler(async(req,res) => {
//   const {coupon} = req.body;
//   const {_id} = req.user;
//   validateMongoDbId(_id);
//   const validCoupon = await Coupon.findOne({name: coupon});
// if(validCoupon === null){
//   throw new Error("Invalid Coupon")
// }
// const user = await User.findOne({_id});
// let {cartTotal} = await Cart.findOne({
//   orderby: user._id,
// }).populate("products.product");
// let totalAfterDiscount = (cartTotal - (cartTotal * validCoupon.discount)/100).toFixed(2);
// await Cart.findByIdAndUpdate(
//   {orderby:user._id},
//   {totalAfterDiscount},
//   {new:true} )
//   res.json(totalAfterDiscount)
// })

//gpt apply coupon
const applyCoupon = asyncHandler(async (req, res) => {
  try {
    const { coupon } = req.body;
    const { _id } = req.user;
    validateMongoDbId(_id);

    // Log coupon information
    console.log('Coupon:', coupon);

    const validCoupon = await Coupon.findOne({ name: coupon });

    // Log validCoupon
    console.log('Valid Coupon:', validCoupon);

    if (validCoupon === null) {
      throw new Error('Invalid Coupon');
    }

    const user = await User.findById(_id);

    // Log user information
    console.log('User ID Type:', typeof user._id);

    // Convert user._id to a string representation of the ObjectId
    const userIdString = user._id.toString();

    // Fetch the cart based on the user's ObjectId string
    let { cartTotal } = await Cart.findOne({
      orderby: userIdString,
    }).populate('products.product');

    // Log cartTotal
    console.log('Cart Total:', cartTotal);

    const totalAfterDiscount = (cartTotal - (cartTotal * validCoupon.discount) / 100).toFixed(2);

    // Log totalAfterDiscount
    console.log('Total After Discount:', totalAfterDiscount);

    await Cart.findOneAndUpdate(
      { orderby: userIdString }, // Update using the string representation of ObjectId
      { totalAfterDiscount },
      { new: true }
    );

    res.json(totalAfterDiscount);
  } catch (error) {
    console.error(error); // Log any errors
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

const createOrder = asyncHandler(async (req,res) => {
  const { COD,couponApplied} = req.body;
  console.log('Value of COD:', COD); // Log the value of COD
  const { _id } = req.user;
    validateMongoDbId(_id);
    try {
      if(!COD) throw new Error('Create cash order failed');
  const user = await User.findById(_id);
  let userCart = await Cart.findOne({ orderby: user._id})
  
  let finalAmount = 0;
  if(couponApplied && userCart.totalAfterDiscount){
    finalAmount = userCart.totalAfterDiscount;
    

  } else {
    finalAmount = userCart.cartTotal;

  }
     let newOrder = await new Order({
       products: userCart.products,
       paymentIntent: {
         id: uniqid(),
         method: "COD",
        amount: finalAmount,
         status: "Cash on Delivery",
         created: Date.now(),
         currency: "usd",
      },
      orderby: user._id,
      orderStatus:"Cash on Delivery",
    }).save();
   
    let update = userCart.products.map((item) => {
      return {
        updateOne: {
          filter: { _id: item.product._id },
          update: {$inc: {quantity: -item.count, sold: +item.count}},
        }
      }
    })
    const updated = await Product.bulkWrite(update,{});
    res.json({message: "success"});
    } catch (error) {
      throw new Error(error)
    }
})

const getOrders = asyncHandler(async(req,res)=>{
  const { _id } = req.user;
validateMongoDbId(_id);
try {
  const userorders = await Order.findOne({orderby: _id}).populate('products.product').exec()
  res.json(userorders)
} catch (error) {
  throw new Error(error)
}
})

const updateOrderStatus = asyncHandler(async(req,res)=>{
const {status} = req.body;
const {id} = req.params;
validateMongoDbId(id);
try {
  const updateOrderStatus = await Order.findByIdAndUpdate(id,
    {
      orderStatus: status,
      paymentIntent: {
      status: status,
     }
    },
    {new: true})
    res.json(updateOrderStatus)
} catch (error) {
  throw new Error(error)
}
})
module.exports = { createUser,forgotpasswordToken, loginUserCtrl, getUserCart,updatePassword,getallUser, getaUser, deleteaUser, updatedUser,blockUser,resetPassword,saveAddress,getWishlist, userCart,logout,unblockUser,handleRefreshToken, getOrders,updateOrderStatus,loginAdmin, emptycart,applyCoupon, createOrder}