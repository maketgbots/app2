const mongoose = require('mongoose')
const Schema = mongoose.Schema


const UserSchema = new Schema({
    telegramId: {
        type: Number,
        required: true
    },
    pictures: {
        type: [String],
        default: []
    }
})

mongoose.model('persons', UserSchema)