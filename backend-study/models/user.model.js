import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    state: {
        type: String,
        required: [true, 'State is required'],
        trim: true,
        minLength: 1,
        maxLength: 50,
        // Removed unique: true so you can have the same project in multiple slots
    },
    time: {
        hour: {
            type: Number,
            required: [true, 'Hour is required'],
            min: 0,
            max: 23
        },
        minute: {
            type: Number,
            required: [true, 'Minute is required'],
            min: 0,
            max: 59
        }
    },
}, { timestamps: true });
userSchema.index({ "time.hour": 1, "time.minute": 1 }, { unique: true });

const User = mongoose.model('User',userSchema);
export default User;