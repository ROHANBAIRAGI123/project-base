import mongoose from "mongoose";

const projectSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        maxlength: 120,
    },
    description: {
        type: String,
        trim: true,
        maxlength: 2000,
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    totalMembers: {
        type: Number,
        default: 1,
        min: 1,
    }
},{
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
})

projectSchema.index({ createdBy: 1 });
projectSchema.index({ createdBy: 1, name: 1 }, { unique: true });

// Keep tasks normalized in Task collection and expose via virtual populate.
projectSchema.virtual("tasks", {
    ref: "Task",
    localField: "_id",
    foreignField: "project",
});

export const Project = mongoose.model("Project", projectSchema);