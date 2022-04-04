// 게시글 데이터베이스 스키마 정의

var autoIncrement = require('mongoose-auto-increment');
var Schema = {};


Schema.createSchema = function(mongoose){
    var PostSchema = mongoose.Schema({
        post_id: {type: Number, index: {unique: true}}, //TODO: auto increase 설정하기
        title: {type: String, required: true},
        content: {type: String, required: true},
        createdAt: {type: Date, default: new Date() },
        from: {type: String, required: true},
        to: {type: String, required: true},
        check: {type: Boolean, required: true}
    });

    //AutoIncrease를 실현시키기 위해서 사용하는 코드

    PostSchema.plugin(autoIncrement.plugin, {
        model : 'PostModel',
        fiel: 'post_id',
        startAt : 1,
        increment: 1
    });

    var Post = connectioon.model('PostModel', board);
}