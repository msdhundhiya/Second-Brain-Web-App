import mongoose, { Schema, Types, model } from "mongoose";
import * as dotenv from 'dotenv';
dotenv.config();
const mongourl = process.env.MONGO_URL;
if (!mongourl){
    throw new Error("MONGO_URL is not defined in the .env file");
}
const connectToDB = async () => {
    try {
        await mongoose.connect(mongourl);
    } catch (error) {
        console.error("DB Connection Error:", error);
    }
};
export interface Iuser {
  _id : mongoose.Types.ObjectId,
  email : string,
  password : string
}
export interface Itag {
  title : string
}
export interface Icontent {
  link: string,
  type: string,
  title : string,
  tags :mongoose.Types.ObjectId[],
  userId :mongoose.Types.ObjectId
}
export interface Ilink {
  hash : string,
  userId :mongoose.Types.ObjectId
}
connectToDB();
const userSchema = new mongoose.Schema<Iuser>({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});
const tagSchema = new mongoose.Schema<Itag>({
  title: { type: String, required: true, unique: true }
});
const contentTypes = ['image', 'video', 'article', 'audio']; // Extend as needed

const contentSchema = new Schema<Icontent>({
  link: { type: String, required: true },
  type: { type: String, enum: contentTypes, required: true },
  title: { type: String, required: true },
  tags: [{ type: mongoose.Types.ObjectId, ref: 'Tag' }],
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
});
const linkSchema = new mongoose.Schema<Ilink>({
  hash: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
});

const userModel = mongoose.model("user",userSchema);
const contentModel = mongoose.model( "content", contentSchema);
const tagModel = mongoose.model("tag",tagSchema);
const linkModel = mongoose.model("links",linkSchema);

export const UserModel = model<Iuser>("User", userSchema);
export const ContentModel = model<Icontent>("Content", contentSchema);
export const TagModel = model<Itag>("Tag", tagSchema);
export const LinkModel = model<Ilink>("Link", linkSchema);