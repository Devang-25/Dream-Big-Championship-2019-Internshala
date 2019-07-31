var express  = require('express');
var fs = require('fs'),
    PNG = require('pngjs').PNG,
    pixelmatch = require('pixelmatch');
var app = express();
var bodyParser  = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine","ejs");
app.use('/exported-images', express.static('static'));
app.set("view engine","ejs");

var Jimp = require('jimp');

//database
var difference_of_img=[
    10367,
    49951,
    78140,
    174706,
];

var sampleImage = [
    "static/exported-images/front.png",
    "static/exported-images/frontCopy.png",
    "static/exported-images/left.png",
    "static/exported-images/leftCopy.png",
    "static/exported-images/rear.png",
    "static/exported-images/rearCopy.png",
    "static/exported-images/right.png",
    "static/exported-images/rightCopy.png",
]
var tArray = [];
var SignalPercentage = [];
var totalDiff = 0;
var T = 4;
//algorithm

//1. Total Time allocated to a 4 way traffic light signal T    //min:T=2   //max:T=6
// var T = 4;

//2. Total density of vehicles at particular T time-period
// var totalDiff = 0;
function transOpt(){
    
    tArray = [];
    SignalPercentage = [];
    totalDiff = 0;
    difference_of_img.forEach((e)=>{
        totalDiff += e;
    });
    console.log(totalDiff);

    //3. Percentage allocation to each signal {front->left->rear->right}
    // var SignalPercentage = [];
    difference_of_img.forEach((e)=>{
        SignalPercentage.push(e/totalDiff);
    });
    console.log(SignalPercentage);

    // [32,16,25,55]

    //2. time alloted to particular side of traffic signal 
    //      t = SignalPercentage[i] * T
    // tArray = [];
    SignalPercentage.forEach((e)=>{
        tArray.push(e*T);
    });
}

transOpt();


//grayscale and black&white conversion
sampleImage.forEach((img)=>{
    Jimp.read(img, (err, lenna) => {
        if (err) throw err;
        lenna
          // .resize(256, 256)
          .quality(100) 
          .greyscale() 
          .contrast(1)
          .posterize(2)
          .write(img); // save
      });
})



//taking difference
var img1 = fs.createReadStream("static/exported-images/front.png").pipe(new PNG()).on('parsed', doneReading),
    img2 = fs.createReadStream("static/exported-images/frontCopy.png").pipe(new PNG()).on('parsed', doneReading),
    filesRead = 0;

function doneReading() {
    if (++filesRead < 2) return;
    var diff = new PNG({width: img1.width, height: img1.height});

    var diffPixel=pixelmatch(img1.data, img2.data, diff.data, img1.width, img1.height, {threshold: 0.1});
    // console.log(diffPixel);
    diff.pack().pipe(fs.createWriteStream("static/exported-images/difffront.png"));
}

//routes
app.get("/",(req,res)=>{
    res.render('newData',{tArray:tArray});
});


app.post("/",(req,res)=>{
    var frontData = parseInt(req.body.inputTop) ;
    var leftData = parseInt(req.body.inputLeft) ;
    var rearData = parseInt(req.body.inputBottom);
    var rightData = parseInt(req.body.inputRight) ;
    console.log(frontData+leftData+rearData+rightData);
    difference_of_img = [];
    difference_of_img.push(frontData);
    difference_of_img.push(leftData);
    difference_of_img.push(rearData);
    difference_of_img.push(rightData);
    // transOptim();
    transOpt();
    res.redirect("/");
})


//running the server
app.listen(3000,()=>{
    console.log("Server running at port 3000")
})