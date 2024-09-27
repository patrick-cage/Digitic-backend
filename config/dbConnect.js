const { default: mongoose } = require("mongoose")

mongoose.set('strictQuery', false);
const dbConnect = () => {
try {
    const conn = mongoose.connect(process.env.MONGODB_URL)
    console.log("database connected Successfully")
} catch (error) {
   console.log("Database error")
}}

module.exports = dbConnect;