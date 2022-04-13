// 게시글 데이터베이스 스키마 정의
const mongoose = require('mongoose');

const {Schema} = mongoose;

const postSchema = new Schema({
    post_id: {
        type: Number, 
        index: {unique: true}
    },
    title: {
        type: String,
         required: true
    },
    content: {
        type: String, 
        required: true
    },
    createdAt: {
        type: Date, 
        default: new Date() 
    },
    from: {
        type: String, 
        required: true
    },
    to: {
        type: String, 
        required: true
    },
    check: {
        type: Boolean, 
        required: true
    },
});

module.exports = mongoose.model('Post', postSchema)