const mongoose = require('mongoose')
const crypto = require('crypto');
const GridFsStorage = require('multer-gridfs-storage');
const Grid = require('gridfs-stream');
const methodOverride = require('method-override');
const simple = mongoose.model('simple')
const uploadd = mongoose.model('upload')
const bcrypt = require('bcryptjs')
const passport = require('passport')
const multer  = require('multer')
const path = require('path')
const session = require('express-session')
const cookieParser = require('cookie-parser')
 const flash = require('connect-flash') 
 module.exports = (app)=>{

      
    app.use(cookieParser('secret'));
app.use(session({
    secret:'secret',
    maxAge:3600000,
    resave:true,
    saveUninitialized:true
}))

app.use(passport.initialize())
app.use(passport.session())

app.use(flash())
app.use((req,res,next)=>{
    res.locals.success_message = req.flash('success_message');
    res.locals.error_message = req.flash('error_message');
    res.locals.error = req.flash('error');
    next()
})
const checkAuthenticated = (req, res, next)=>{
    if (req.isAuthenticated()) {
        res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, post-check=0, pre-check=0');
        return next();
    } else {
        res.redirect('/login');
    }
}
    app.get('/',(req,res)=>{
        res.render('signup')
    })
    app.post('/register',(req,res)=>{
        var {email,username,password,confirmpassword}=req.body;
        var err;
        if(!email || !username || !password || !confirmpassword){
            err = 'Plz fill all the fields'
            res.render('signup',{'err':err})
        }
        if(password != confirmpassword){
             err = `Password don't matched`
            res.render('signup',{'err':err,'email':email,'username':username})
        }
        if(password.length < 3){
             err = `Password must be 3 characterss long`
            res.render('signup',{'err':err,'email':email,'username':username})
        }
        // if(typeof(username) != String){
        //     eror = 'Username must be string'
        //     res.render('signup',{'err':eror,'email':email,'username':username})
        // }
        if(typeof(err) == 'undefined'){
            simple.findOne({ email : email},(err,data)=>{
                if(err) throw err;
                if(data){
                    console.log('User Exist with this email')
                    err = 'User already exist with this email'
                    res.render('signup',{'err':err,'email':email,'username':username})
                }else{
                    bcrypt.genSalt(10,(err,salt)=>{
                        console.log('salt step')
                        if(err) throw err;
                            bcrypt.hash(password,salt ,(err,hash)=>{
                                console.log('hash step')
                                if(err) throw err;
                                    password = hash;
                                    simple({
                                        email,
                                        username,
                                        password
                                    }).save((err,data)=>{
                                        if(err) throw err
                                        req.flash('success_message','Registered Successfully.. Login to continue..')
                                            res.redirect('/login')
                                        
                                    })
                                
                            })
                        
                    })
                }
            })
        }
    })
    //Authenticate strategy
    var LocalStrategy = require('passport-local').Strategy;
passport.use(new LocalStrategy({usernameField:'email'},(email,password,done)=>{
    simple.findOne({ email: email }, function (err, data) {
      if (err) { return done(err); }
      if (!data) {
        return done(null, false,{message:'user doesnot exist'});
      }
      bcrypt.compare(password,data.password,(err,match)=>{
          if(err){
              return done(null,false)
          }
          if(!match){
            return done(null,false ,{message:'password doesnot match'})
        }
        if(match){
            return done(null,data)
        }
      })
    });
  }
));
passport.serializeUser((user,cb)=>{
    cb(null,user.id)
})
passport.deserializeUser((id,cb)=>{
    simple.findById(id,(err,user)=>{
        cb(err,user)
    })
})
//Authenticate strategy end
app.get('/login',(req,res)=>{
    res.render('login')
})
app.post('/login',(req,res,next)=>{
    passport.authenticate('local',{
        failureRedirect:'/login',
        successRedirect:'/success',
        failureFlash: true,

    })(req,res,next);
});
app.get('/success',checkAuthenticated,(req,res,next)=>{
 
        res.render('success',{'user':req.user,})
    })
app.get('/logout',(req,res)=>{
    req.logout();
    res.redirect('/login')
})

////////////////////////////////////////////////////////////////////////////////////


// Middleware
app.use(methodOverride('_method'));
app.set('view engine', 'ejs');

//Mongo URI
const mongoURI = 'mongodb://localhost:27017/Node_Passport';

// Create mongo connection
const conn = mongoose.createConnection(mongoURI);

// Init gfs
let gfs;

conn.once('open', () => {
  // Init stream
  gfs = Grid(conn.db, mongoose.mongo);
  gfs.collection('uploads');
});

// Create storage engine
const storage = new GridFsStorage({
  url: mongoURI,
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      crypto.randomBytes(16, (err, buf) => {
        if (err) {
          return reject(err);
        }
        const filename = buf.toString('hex') + path.extname(file.originalname);
        const fileInfo = {
          filename: filename,
          bucketName: 'uploads'
        };
        resolve(fileInfo);
      });
    });
  }
});
const upload = multer({ storage });

// @route GET /
// @desc Loads form
app.get('/index', (req, res) => {
  gfs.files.find().toArray((err, files) => {
    // Check if files
    if (!files || files.length === 0) {
      res.render('index', { files: false });
    } else {
      files.map(file => {
        if (
          file.contentType === 'image/jpeg' ||
          file.contentType === 'image/png'
        ) {
          file.isImage = true;
        } else {
          file.isImage = false;
        }
      });
      res.render('index', { files: files });
    }
  });
});

// @route POST /upload
// @desc  Uploads file to DB
app.post('/upload', upload.single('file'), (req, res) => {
  // res.json({ file: req.file });
  res.redirect('/index');
});

// @route GET /files
// @desc  Display all files in JSON
app.get('/files', (req, res) => {
  gfs.files.find().toArray((err, files) => {
    // Check if files
    if (!files || files.length === 0) {
      return res.status(404).json({
        err: 'No files exist'
      });
    }

    // Files exist
    return res.json(files);
  });
});

// @route GET /files/:filename
// @desc  Display single file object
app.get('/files/:filename', (req, res) => {
  gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
    // Check if file
    if (!file || file.length === 0) {
      return res.status(404).json({
        err: 'No file exists'
      });
    }
    // File exists
    return res.json(file);
  });
});

// @route GET /image/:filename
// @desc Display Image
app.get('/image/:filename', (req, res) => {
  gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
    // Check if file
    if (!file || file.length === 0) {
      return res.status(404).json({
        err: 'No file exists'
      });
    }

    // Check if image
    if (file.contentType === 'image/jpeg' || file.contentType === 'image/png') {
      // Read output to browser
      const readstream = gfs.createReadStream(file.filename);
      readstream.pipe(res);
    } else {
      res.status(404).json({
        err: 'Not an image'
      });
    }
  });
});

// @route DELETE /files/:id
// @desc  Delete file
app.delete('/files/:id', (req, res) => {
  gfs.remove({ _id: req.params.id, root: 'uploads' }, (err, gridStore) => {
    if (err) {
      return res.status(404).json({ err: err });
    }

    res.redirect('/index');
  });
});

}