// 환자 데이터베이스 스키마 정의
var autoIncrement = require('mongoose-auto-increment');
var Schema = {};


Schema.createSchema = function(mongoose){
    var PatientSchema = mongoose.Schema({
        pat_id: {type: String, index: {unique: true}},
        pat_number: {type: String, unique: true, required: true},
        pat_name: {type: String, required: true},
        sex: {type: String, required:true},
        birth: {type: Date, required: true},
        hos_id: {type: String, required: true},
        user_id: {type: String}
    });

    //AutoIncrease를 실현시키기 위해서 사용하는 코드

    PatientSchema.plugin(autoIncrement.plugin, {
        model : 'PatientModel',
        fiel: 'pat_id',
        startAt : 1,
        increment: 1
    });

    var Patient = connectioon.model('PatientModel', board);
}