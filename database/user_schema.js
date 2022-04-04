// 개인(유저) 데이터베이스 스키마 정의

var Schema = {};


Schema.createSchema = function(mongoose){
    var UserSchema = mongoose.Schema({
        user_id: {type: String, index: {unique: true}},
        uid: {type: String, unique: true, required: true},
        pwd: {type: String, required: true},
        username: {type: String, required:true},
        pat_id: {type: Array, required: true},  // Array이기는 한데 여기 안에서 미리 배열을 만들어서 입력할건지?
        hos_id: {type: Array, required: true},  // (이어서) 아니면 환자 정보를 입력할 때 만들어서 입력할건지?
        createdAt: {type: Date, default: new Date() },
        email: {type:email, required: trye, unique: true}
    });

    //AutoIncrease를 실현시키기 위해서 사용하는 코드

    UserSchema.plugin(autoIncrement.plugin, {
        model : 'UserModel',
        fiel: 'user_id',
        startAt : 1,
        increment: 1
    });

    var User = connectioon.model('UserModel', board);


}