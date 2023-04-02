const express = require('express');
const router = express.Router();
const bcrypt = require("bcrypt");
const Users = require("../models/mongoUsers.js");
const waitList = require("../models/mongoWaitList.js");

router.get('/', (req, res) => {
    res.render('user/user.ejs');
})


router.post('/check', async (req, res) => {
    try{
        const email = req.body.semail;
        if(!email) return res.sendStatus(404);
        const check = await Users.findOne({ email : email });
        if(!check) return res.render('user/error.ejs');
        res.render('user/answer.ejs', {message: check.credit})
    }
    catch(err){
        res.sendStatus(404);
    }
})


router.post('/add', async (req, res) => {
    try{
        const email = req.body.email;
        const password = req.body.password;
        const credit = req.body.credit;
        if(!email|| !password || !credit) return res.render('user/error.ejs');
        const user = await Users.findOne({ email : email });
        if(user === "true") return res.render('user/error.ejs');
        bcrypt.hash(password, 10, (err, result) => {
            if(err) return res.render('user/error.ejs');
            else{
                var pattern = /[^0-9.-]+/g;
                const cena = "0.40"; //! CENA ZA EGZAMINz
                const koszt = parseFloat(cena.replace(pattern, '')) * credit;
                //! PUSH USER INTO A WAITLIST COLLECTION
                push(email,password,credit,koszt);
                async function push(email,password,credit,koszt){
                    const push = await waitList.create({email: email, password: password, credit: credit, price: koszt});
                    console.log(push)
                    if(!push) return res.render('user/error.ejs');
                    else {return res.status(301).render('user/succes.ejs', {message: koszt})}
                }
            }
        });

    }
    catch(err){
        res.sendStatus(404);
    }
})


module.exports = router;