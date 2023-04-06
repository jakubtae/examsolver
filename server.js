if(process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cors = require("cors");
const db = require('./models/conn.js');
const cookieParser = require('cookie-parser');
var path = require('path');
app.use(cors());
app.use(express.static(path.join(__dirname, "public"))); //! static folder declaration

app.set("view engine", "ejs");
app.use(cookieParser());
app.set('views', path.join(__dirname, 'views'));
app.use(express.json())
app.use(bodyParser.urlencoded({ limit: "10mB", extended: false })); //! for FORMS USAGE

const adminRouter = require("./routes/admin");
const inf03Router = require("./routes/inf03");
const inf02Router = require("./routes/inf02");
const homeRouter = require("./routes/home");
const userRouter = require("./routes/user");
app.use("/admin", adminRouter);
app.use("/inf03", inf03Router);
app.use("/inf02", inf02Router);
app.use("/home", homeRouter);
app.use("/user", userRouter);


app.get("/", (req, res) =>{
    res.redirect("/home");
});

app.listen(3000);
