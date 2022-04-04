// 병원 데이터베이스 스키마 정의
var autoIncrement = require('mongoose-auto-increment');
var Schema = {};


Schema.createSchema = function(mongoose){
    var HospitalSchema = mongoose.Schema({
        hos_id: {type: String, index: {unique: true}},
        hid: {type: String, unique: true, required: true},
        pwd: {type: String, required: true},
        hos_name: {type: String, required:true},
        address: {type: String, required: true},
        hos_number: {type: String, required: true},
        createdAt: {type: Date, default: new Date() },
        email: {type: String, unique: true, required: true}
    });

    //AutoIncrease를 실현시키기 위해서 사용하는 코드

    HospitalSchema.plugin(autoIncrement.plugin, {
        model : 'HospitalModel',
        fiel: 'hos_id',
        startAt : 1,
        increment: 1
    });

    var Hospital = connectioon.model('HospitalModel', board);

}