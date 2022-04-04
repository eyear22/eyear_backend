// 사진 데이터베이스 스키마 정의
var autoIncrement = require('mongoose-auto-increment');
var Schema = {};


Schema.createSchema = function(mongoose){
    var ImageSchema = mongoose.Schema({
        img_id: {type: Number, index: {unique: true}},
        image: {type: String, required: true},
        post_id: {type: Number, required: true}
    });

        //AutoIncrease를 실현시키기 위해서 사용하는 코드

        ImageSchema.plugin(autoIncrement.plugin, {
            model : 'ImageModel',
            fiel: 'img_id',
            startAt : 1,
            increment: 1
        });
    
        var Image = connectioon.model('ImageModel', ImageSchema);

}