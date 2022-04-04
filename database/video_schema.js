// 영상 데이터베이스 스키마 정의
var autoIncrement = require('mongoose-auto-increment');

var Schema = {};


Schema.createSchema = function(mongoose){
    var VideoSchema = mongoose.Schema({
        video_id: {type: String, index: {unique: true}}, //TODO: auto increase 설정하기
        video: {type: String, required: true},
        post_id: {type: String, required: true}
    });

    //AutoIncrease를 실현시키기 위해서 사용하는 코드

    VideoSchema.plugin(autoIncrement.plugin, {
        model : 'VideoModel',
        fiel: 'video_id',
        startAt : 1,
        increment: 1
    });

    var Video = connectioon.model('VideoModel', board);
}