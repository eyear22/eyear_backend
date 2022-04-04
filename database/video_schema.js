// 영상 데이터베이스 스키마 정의

var Schema = {};


Schema.createSchema = function(mongoose){
    var VideoSchema = mongoose.Schema({
        video_id: {type: String, index: {unique: true}}, //TODO: auto increase 설정하기
        video: {type: String, required: true},
        post_id: {type: String, required: true}
    });

}