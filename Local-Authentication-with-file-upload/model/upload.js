const mongoose = require('mongoose')
 const schema = mongoose.Schema
 const uploadSchema = schema({
     imagename:{
         type:String
     }
 })
 mongoose.model('upload',uploadSchema)