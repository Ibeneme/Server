const mongoose = require('mongoose');

const awaitingListSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    }
});


const AwaitingList = mongoose.model('AwaitingList', awaitingListSchema);

module.exports = AwaitingList;
