const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    taskName: {
        type: String,
        required: true,
    },
    timeline: {
        type: String,
        required: false, 
    },
    deadline: {
        type: Date,
        required: true, 
    },
}, { timestamps: true });

module.exports = mongoose.model('Task', taskSchema);
