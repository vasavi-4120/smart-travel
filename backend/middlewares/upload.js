const multer = require("multer");
const path = require("path");

// Configure how and where files are stored
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // This points to your 'uploads' folder seen in your structure
    cb(null, "uploads/"); 
  },
  filename: function (req, file, cb) {
    // Generates a unique name: timestamp + original name
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

module.exports = upload;