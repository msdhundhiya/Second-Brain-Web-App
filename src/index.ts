import express from  "express";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import zod from "zod";
import bcrypt from "bcrypt";
import { UserModel,ContentModel,LinkModel,TagModel } from "./db.js";

const  app = express();
app.use(express.json)
app.post("/api/v1/signup",async (req,res)  =>{
    const requirebody = zod.object({
            email : zod.email().min(5).max(50),
            password : zod.string().min(8).max(50).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/),
            firstname: zod.string().min(3).max(50),
            lastname: zod.string().min(3).max(50)
        });
        const parseddata = requirebody.safeParse(req.body);
        if(!parseddata.success){
            return res.json({
                message: "incorrect data format",
                error: parseddata.error
            })
        }
        const {email,password} = req.body;
        const hashedpass = await bcrypt.hash(password,12);
        let errorthrown = false;
        try {
            await UserModel.create({
                email: email,
                password: hashedpass
            });
        } catch (error) {
            errorthrown = true ;
            return res.status(409).json({
                message: "User already exists!",
            });
            
        }
        if (!errorthrown){
            res.status(201).json({
            message: "you are signed up"
            });
        }
});
app.post("/api/v1/signin",(req,res) =>{
    
});
app.post("/api/v1/content",(req,res) =>{
    
});
app.get("/api/v1/content",(req,res) =>{
    
});

app.delete("/api/v1/content",(req,res) =>{
    
});
app.post("/api/v1/brain/share",(req,res) =>{
    
});
app.get("/api/v1/brain:shareLink",(req,res) =>{
    
});

app.listen(3000);