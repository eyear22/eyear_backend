// 공지사항 데이터베이스 스키마 정의

var Schema = {};


Schema.createSchema = function(mongoose){
    var NoticeSchema = mongoose.Schema({
        notice_id: {type: String, index: {unique: true}},
        title: {type: String, required: true},
        content: {type: String, required: true},
        createdAt: {type: Date, default: new Date() },
        hos_id: {type: String, required: false}
    });

}