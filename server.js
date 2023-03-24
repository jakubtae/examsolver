const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cors = require("cors");

app.use(cors());

app.set("view engine", "ejs");
app.use(express.static("public")); //! static folder declaration
app.use(express.json())
app.use(bodyParser.urlencoded({ limit: "10mB", extended: false })); //! for FORMS USAGE


const adminRouter = require("./routes/admin");
const inf03Router = require("./routes/inf03");
const inf02Router = require("./routes/inf02");
const homeRouter = require("./routes/home");
app.use("/admin", adminRouter);
app.use("/inf03", inf03Router);
app.use("/inf02", inf02Router);
app.use("/home", homeRouter);


app.get("/", (req, res) =>{
    res.redirect("/home");
});

app.listen(3000);
