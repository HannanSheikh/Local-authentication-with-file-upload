const mongoose = require('mongoose')
 const schema = mongoose.Schema

 const simpleSchema = schema({
    email:{
        type:String,
        require:true
    },
    username:{
        type:String,
        require:true
    },
    password:{
        type:String,
        require:true
    },
    confirmpassword:{
        type:String,
        require:true
    }
 })
 mongoose.model('simple',simpleSchema)