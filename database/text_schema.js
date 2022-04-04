// 자막 데이터베이스 스키마 정의

var Schema = {};


Schema.createSchema = function(mongoose){
    var TextSchema = mongoose.Schema({
        text_id: {type: String, index: {unique: true}},
        text: {type: String, required: true},
        vid: {type: String, required: true}
    });

}