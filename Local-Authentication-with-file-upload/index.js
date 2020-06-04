const express = require('express');
const app = express();
const path = require('path');
const port = process.env.PORT||5000;
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
app.use(bodyParser.urlencoded({extended:true}))
app.use(bodyParser.json());
app.use(express.static(__dirname+"./public/"))

mongoose.connect('mongodb://localhost:27017/Node_Passport',{useNewUrlParser:true,
useUnifiedTopology:true}).then(()=>console.log('DataBase Connected..'))
require('./model/simple')
require('./model/upload')
app.set('view engine','ejs')
app.set('views',path.join(__dirname,'views'))
require('./routes')(app)

app.listen(port,()=>{
    console.log('Server is running on '+port)
})

////////////////////////////////////////////////////////////////////////////////////////////////////
