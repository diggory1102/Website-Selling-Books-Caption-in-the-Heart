const mongoose = require('mongoose');
const { Product, Publisher } = require('./src/models/database');

async function checkData() {
    await mongoose.connect('mongodb://127.0.0.1:27017/web_ban_truyen');
    const products = await Product.find().populate('publisherId').limit(1);
    console.log("Product:", JSON.stringify(products[0], null, 2));
    const publishers = await Publisher.find();
    console.log("Publishers Count:", publishers.length);
    mongoose.connection.close();
}

checkData();
