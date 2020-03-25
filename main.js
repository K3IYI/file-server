import express from "express";
import multer, { diskStorage, MulterError } from "multer";
import cors from "cors";
import path from "path";
import fs from "fs-extra";
import formidable from "formidable";
import concat from "concat-files";

const app = express();

app.use(cors());

//#region single upload
// const storage = diskStorage({
//   destination: function(req, file, cb) {
//     cb(null, "public");
//   },
//   filename: function(req, file, cb) {
//     cb(null, Date.now() + "-" + file.originalname);
//   }
// });

// const upload = multer({ storage: storage }).array("file");

// app.post("/upload", function(req, res) {
//   upload(req, res, function(err) {
//     if (err instanceof MulterError) {
//       return res.status(500).json(err);
//     } else if (err) {
//       return res.status(500).json(err);
//     }
//     return res.status(200).send(req.file);
//   });
// });
//#endregion

//#region large file multipart upload with merge
const uploadDir = path.resolve(__dirname, "public");

// 检查文件的MD5
app.get("/check/file", (req, resp) => {
  let query = req.query;
  let fileName = query.fileName;
  let fileMd5Value = query.fileMd5Value;
  // 获取文件Chunk列表
  getChunkList(
    path.join(uploadDir, fileName),
    path.join(uploadDir, fileMd5Value),
    data => {
      resp.send(data);
    }
  );
});

// 获取文件Chunk列表
async function getChunkList(filePath, folderPath, callback) {
  let isFileExit = await isExist(filePath);
  let result = {};
  // 如果文件(文件名, 如:node-v7.7.4.pkg)已在存在, 不用再继续上传, 真接秒传
  if (isFileExit) {
    result = {
      stat: 1,
      file: {
        isExist: true,
        name: filePath
      },
      desc: "file exist"
    };
  } else {
    let isFolderExist = await isExist(folderPath);
    // 如果文件夹(md5值后的文件)存在, 就获取已经上传的块
    let fileList = [];
    if (isFolderExist) {
      fileList = await listDir(folderPath);
    }
    result = {
      stat: 1,
      chunkList: fileList,
      desc: "folder list"
    };
  }
  callback(result);
}

// 文件或文件夹是否存在
function isExist(filePath) {
  return new Promise((resolve, reject) => {
    fs.stat(filePath, (err, stats) => {
      // 文件不存在
      if (err && err.code === "ENOENT") {
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
}

// 列出文件夹下所有文件
function listDir(path) {
  return new Promise((resolve, reject) => {
    fs.readdir(path, (err, data) => {
      if (err) {
        reject(err);
        return;
      }
      // 把mac系统下的临时文件去掉
      if (data && data.length > 0 && data[0] === ".DS_Store") {
        data.splice(0, 1);
      }
      resolve(data);
    });
  });
}

app.all("/upload", (req, resp) => {
  const form = new formidable.IncomingForm({
    uploadDir: path.resolve(uploadDir, "tmp")
  });
  form.parse(req, function(err, fields, file) {
    let chunkIndex = fields.chunkIndex;
    let fileMD5Value = fields.fileMD5Value;
    let folder = path.resolve(__dirname, "public", fileMD5Value);
    folderIsExist(folder).then(resolve => {
      let destFile = path.resolve(folder, chunkIndex);
      console.log("----------->", file.data.path, destFile);
      copyFile(file.data.path, destFile).then(
        successLog => {
          console.log(successLog);
          resp.send({
            stat: 1,
            desc: chunkIndex
          });
        },
        errorLog => {
          console.log(errorLog);
          resp.send({
            stat: 0,
            desc: "Error"
          });
        }
      );
    });
  });
  // 文件夹是否存在, 不存在则创建文件
  function folderIsExist(folder) {
    console.log("folderIsExist", folder);
    return new Promise((resolve, reject) => {
      fs.ensureDirSync(path.join(folder));
      console.log("result----", folder);
      resolve("folder created");
    });
  }
  // 把文件从一个目录拷贝到别一个目录
  function copyFile(src, dest) {
    let promise = new Promise((resolve, reject) => {
      fs.rename(src, dest, err => {
        if (err) {
          reject(err);
        } else {
          resolve("copy file:" + dest + " success!");
        }
      });
    });
    return promise;
  }
});

app.all("/merge", async (req, resp) => {
  let query = req.query;
  let fileMD5Value = query.fileMD5Value;
  let fileName = query.fileName;
  console.log(fileMD5Value, fileName);
  mergeFiles(path.resolve(uploadDir, fileMD5Value), uploadDir, fileName);
  resp.send({
    stat: 1
  });
});

// 合并文件
async function mergeFiles(srcDir, targetDir, newFileName) {
  console.log(...arguments);
  fs.createWriteStream(path.resolve(targetDir, newFileName));
  let fileArr = await listDir(srcDir);
  fileArr.sort((x, y) => {
    return x - y;
  });
  // 把文件名加上文件夹的前缀
  for (let i = 0; i < fileArr.length; i++) {
    fileArr[i] = path.resolve(srcDir, fileArr[i]);
  }
  console.log(fileArr);
  concat(fileArr, path.resolve(targetDir, newFileName), err => {
    if (err) {
      console.log(err);
    }
    console.log("Merge Success!");
  });
}
//#endregion

app.listen(8000, function() {
  console.log("App running on port 8000");
});
