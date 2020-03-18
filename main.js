import express from "express";
import multer, { diskStorage, MulterError } from "multer";
import cors from "cors";

const app = express();

app.use(cors());

const storage = diskStorage({
  destination: function(req, file, cb) {
    cb(null, "public");
  },
  filename: function(req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({ storage: storage }).single("file");

app.post("/upload", function(req, res) {
  upload(req, res, function(err) {
    if (err instanceof MulterError) {
      return res.status(500).json(err);
    } else if (err) {
      return res.status(500).json(err);
    }
    return res.status(200).send(req.file);
  });
});

app.listen(8000, function() {
  console.log("App running on port 8000");
});
