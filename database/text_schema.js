// 자막 데이터베이스 스키마 정의
var autoIncrement = require('mongoose-auto-increment');
var Schema = {};


Schema.createSchema = function(mongoose){
    var TextSchema = mongoose.Schema({
        text_id: {type: Number, index: {unique: true}},
        text: {type: String, required: true},
        vid: {type: Number, required: true}
    });

    //AutoIncrease를 실현시키기 위해서 사용하는 코드

    TextSchema.plugin(autoIncrement.plugin, {
        model : 'TextModel',
        fiel: 'text_id',
        startAt : 1,
        increment: 1
    });

    var Text = connectioon.model('TextModel', TextSchema);
}