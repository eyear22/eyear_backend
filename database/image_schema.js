// 사진 데이터베이스 스키마 정의

var Schema = {};


Schema.createSchema = function(mongoose){
    var ImageSchema = mongoose.Schema({
        img_id: {type: String, index: {unique: true}},
        image: {type: String, required: true},
        post_id: {type: String, required: true}
    });

}