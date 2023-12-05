const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var mySchema = new mongoose.Schema({
    name :{ type: String, required: true},
    email :{ type: String , required: true},
    password :{ type: String , required: true},
    lastname :{ type: String , required: true},
    role :{ type: String , default : 'User'}, 
    contactNumber : {type:Number} ,
    status :{ type: Number, default: 0},
    tempPassword : { type: String},
    smtpDetails :{ type: Object },
    s3Buket : {type : Object},
    socialPlateforms : {type : Object},
    totalPost :{type : Number,default : 0},
    facebookCount :{type : Number,default : 0},
    instragramCount :{type : Number,default : 0},
    profile : {type : String,default : 'null'},
}); 
module.exports = mongoose.models['users'] || mongoose.model('users',mySchema)