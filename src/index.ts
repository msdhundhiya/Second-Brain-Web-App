import express ,{type Request,type Response} from  "express";
import mongoose, { isValidObjectId } from "mongoose";
import jwt from "jsonwebtoken";
import {z} from "zod";
import bcrypt from "bcrypt";
import { UserModel,ContentModel,LinkModel,TagModel } from "./db.js";
import { type Iuser, type Icontent, type Ilink , type Itag} from './db.js';
import { authMiddleware } from "./middlewares.js";
import { randomBytes } from "crypto";
const jwtSecret = process.env.JWT_SEC_USER;
if (!jwtSecret){
    console.error("FATAL error jwt is not defined in env files")
    process.exit(1)
}
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
app.post("/api/v1/content",authMiddleware(jwtSecret),async(req: Request<{}, {}, Icontent>, res: Response) =>{
    const {link,type,title,tags } = req.body;
    const userId = req.userId;
    try{await ContentModel.create({
        link,
        type,
        title,
        tags,
        userId
    });
    return res.status(201).json({
        message: "content added"
    })}catch(e){
        console.error("failed to create content", e)
        return res.status(500).json({
            message:"An Internal Server erroe occured while adding content",
        })
    }

    
});
app.get("/api/v1/content",authMiddleware(jwtSecret),async(req: Request,res:Response) =>{

    const userId = req.userId;
    try{const content = await ContentModel.find({
        userId: userId
    }).populate("userId", "email" );
    return res.json({
        content
    })}catch(e){
        console.error("Something is Wrong", e);
        return res.json({
            message: "unable to find content"
        })
    }
    
});

app.delete("/api/v1/content",authMiddleware(jwtSecret),async (req: Request,res: Response) =>{
    const id = req.body.id;
    // console.log(id);
    // console.log(req.userId);
    if (!isValidObjectId(id)) {
        return res.status(400).json({ message: "Invalid content ID format" });
    }
    try {const deletedContent = await ContentModel.findOneAndDelete({
        _id: id,
        userId : req.userId
    });
    // console.log(deletedContent);
    if (!deletedContent) {
            return res.status(404).json({
                message: "Content not found or you do not have permission to delete it"
            });
        }
    return res.json({
        message: "content Deleted"
    });}catch(e){
        console.error("Something is Wrong", e);
        return res.json({
            message: "unable to Delete content"
        })
    }
});
app.post("/api/v1/brain/share", authMiddleware(jwtSecret), async (req: Request, res: Response) => {
    try {
        const existingLink = await LinkModel.findOne({ userId: req.userId });
        if (existingLink) {
            return res.status(200).json({ hash: existingLink.hash });
        }
        const hash = randomBytes(8).toString('hex');

        const newLink = await LinkModel.create({
            userId: req.userId,
            hash: hash
        });

        res.status(201).json({ hash: newLink.hash });

    } catch (e) {
     
        console.error("Error creating share link:", e);
        res.status(500).json({ message: "An internal server error occurred." });
    }
});

app.delete("/api/v1/brain/share", authMiddleware(jwtSecret), async (req: Request, res: Response) => {

    try {
        await LinkModel.deleteOne({ userId: req.userId });
        res.status(200).json({ message: "Sharing link removed successfully." });
    } catch (e) {
        console.error("Error deleting share link:", e);
        res.status(500).json({ message: "An internal server error occurred." });
    }
});

app.get("/api/v1/brain/share/:hash", async (req: Request, res: Response) => {
   
    const { hash } = req.params;

    try {
        const link = await LinkModel.findOne({ hash });

        if (!link) {
            
            return res.status(404).json({ message: "This sharing link is invalid or has expired." });
        }

        const [user, content] = await Promise.all([
            UserModel.findOne({ _id: link.userId }),
            ContentModel.find({ userId: link.userId })
        ]);

        if (!user) {
            return res.status(404).json({ message: "The owner of this content could not be found." });
        }

        res.json({
            email: user.email,
            content: content
        });

    } catch (e) {
        console.error("Error fetching shared content:", e);
        res.status(500).json({ message: "An internal server error occurred." });
    }
});


app.listen(3000, () => {
  console.log(`🚀 Server is running successfully on http://localhost:3000`);
});