const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/web_ban_truyen';

mongoose.connect(mongoUri)
    .then(async () => {
        console.log("Connected to MongoDB");
        const Bill = mongoose.model('Bill', new mongoose.Schema({}, { strict: false }));
        const bills = await Bill.find({}).lean();
        console.log("Total bills:", bills.length);
        console.log("Bills list (showing status and history):");
        bills.forEach(b => {
            console.log(`ID: ${b._id}, Code: ${b.billCode}, Status: ${b.status}, HasHistory: ${!!b.history}, HistoryLength: ${b.history ? b.history.length : 0}`);
            if (b.history) {
                console.log("History detail:", JSON.stringify(b.history));
            }
        });
        process.exit(0);
    })
    .catch(err => {
        console.error("Error:", err);
        process.exit(1);
    });
