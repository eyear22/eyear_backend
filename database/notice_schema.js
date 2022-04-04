// 공지사항 데이터베이스 스키마 정의
var autoIncrement = require('mongoose-auto-increment');
var Schema = {};


Schema.createSchema = function(mongoose){
    var NoticeSchema = mongoose.Schema({
        notice_id: {type: Number, index: {unique: true}},
        title: {type: String, required: true},
        content: {type: String, required: true},
        createdAt: {type: Date, default: new Date() },
        hos_id: {type: String, required: false}
    });


    //AutoIncrease를 실현시키기 위해서 사용하는 코드

    NoticeSchema.plugin(autoIncrement.plugin, {
        model : 'NoticeModel',
        fiel: 'notice_id',
        startAt : 1,
        increment: 1
    });

    var Notice = connectioon.model('NoticeModel', NoticeSchema);
}