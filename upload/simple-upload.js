//lib
import multer, { diskStorage, MulterError } from "multer";

//use disk storage to save file
const storage = diskStorage({
  destination: function(req, file, cb) {
    cb(null, "../public");
  },
  filename: function(req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({ storage: storage }).array("file");

export { upload, MulterError };
