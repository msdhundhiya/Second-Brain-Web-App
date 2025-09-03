import express ,{type Request,type Response} from  "express";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import {z} from "zod";
import bcrypt from "bcrypt";
import { UserModel,ContentModel,LinkModel,TagModel } from "./db.js";
import { type Iuser, type Icontent, type Ilink , type Itag} from './db.js';
const  app = express();
app.use(express.json());
const requirebody = z.object({
            email : z.email().min(5).max(50),
            password : z.string().min(8).max(50).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/)
        });
type SignupBody = z.infer<typeof requirebody> 
app.post("/api/v1/signup",async (req: Request<{}, {}, SignupBody>, res: Response)  =>{
        const parseddata = requirebody.safeParse(req.body);
        if(!parseddata.success){
            return res.json({
                message: "incorrect data format",
                error: parseddata.error
            })
        }
        const {email,password} = parseddata.data;
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
                error : error
            });
            
        }
        if (!errorthrown){
            res.status(201).json({
            message: "you are signed up"
            });
        }
});
interface Siginbody {
  email : string,
  password : string
}
app.post("/api/v1/signin",async(req: Request<{}, {}, Siginbody>, res: Response) =>{
    try{
        const {email,password} = req.body;
        const user : Iuser | null = await UserModel.findOne({email});
        if (!user) {
            return res.status(403).json({ message: "Invalid credentials" });
        }
        const passwordmatch = await bcrypt.compare(password,user.password);
        if(passwordmatch){
            const jwtSecret = process.env.JWT_SEC_USER;
            if (!jwtSecret || typeof jwtSecret !== "string") {
                return res.status(500).json({ message: "JWT secret is not configured" });
            }
            const token = jwt.sign(
                { id: user._id },
                jwtSecret
            );
            res.status(200).json({
            token
        });
        }else{
            res.status(403).json({
            message: "invalid credentials"
        });
        }
    }catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({ message: "An internal server error occurred" });
    }
    
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

app.listen(3000, () => {
  console.log(`🚀 Server is running successfully on http://localhost:3000`);
});