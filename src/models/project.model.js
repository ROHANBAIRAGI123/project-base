import mongoose from "mongoose";

const projectSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        unique: true,
    },
    description: {
        type: String,
        trim: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    tasks:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Task"
    },
    totalMembers: {
        type: Number,
        default: 1
    }
},{
    timestamps: true
})

export const Project = mongoose.model("Project", projectSchema);