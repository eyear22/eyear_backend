// 환자 데이터베이스 스키마 정의

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

}