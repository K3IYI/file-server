//lib
import multer, { diskStorage, MulterError } from "multer";
import path from "path";

//use disk storage to save file
const storage = diskStorage({
  destination: function(req, file, cb) {
    cb(null, path.resolve(__dirname, "../public"));
  },
  filename: function(req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({ storage: storage }).array("data");

export { upload, MulterError };
.