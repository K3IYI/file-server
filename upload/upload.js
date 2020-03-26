//lib
import path from "path";
import fs from "fs-extra";
import CombinedStream from "combined-stream";
// import concat from "concat-files";

export const uploadDir = path.resolve(__dirname, "../public");

//check the file in disk
export const isFileUploaded = async (fileName, fileMd5Value, cb) => {
  const filePath = path.resolve(uploadDir, fileName);
  const folderPath = path.resolve(uploadDir, fileMd5Value);
  //check is file exist
  const isFileExit = await isExist(filePath);
  let result = {};

  //if file already exist, response with info for frontend to skip the upload process
  if (isFileExit) {
    result = {
      message: "file exist",
      isFileExist: true
    };
  } else {
    //check is there a folder contain previously uploaded chunks of the file
    //the folder name is the MD5 value
    const isFolderExist = await isExist(folderPath);
    let chunkList = [];

    //if folder exist, get chunks being uploaded
    if (isFolderExist) {
      chunkList = await getAllChunks(folderPath);
    }
    result = {
      message: "file chunks available",
      chunkList: chunkList
    };
  }
  cb(result);
};

//check if file or folder exist
const isExist = path => {
  return new Promise((resolve, reject) => {
    fs.stat(path, (err, stats) => {
      if (err && err.code === "ENOENT") {
        resolve(false);
      } else {
        // ---------can do file MD5 value check-----------------
        // ---------to ensure the file is completely the same-----------------
        resolve(true);
      }
    });
  });
};

//return all chunks in the directory
const getAllChunks = path => {
  return new Promise((resolve, reject) => {
    fs.readdir(path, (err, data) => {
      if (err) {
        reject(err);
        return;
      }

      //remove mac tmp file
      if (data && data.length > 0 && data[0] === ".DS_Store") {
        data.splice(0, 1);
      }
      resolve(data);
    });
  });
};

//check is folder exist, different from isExist function
//this will create the folder if the folder does not exist
export const isFolderExist = folder => {
  console.log("isFolderExist?", folder);
  return new Promise((resolve, reject) => {
    fs.ensureDirSync(path.join(folder));
    console.log("result----", folder);
    resolve();
  });
};

//move file from one place to another
export const moveFile = (src, dest) => {
  return new Promise((resolve, reject) => {
    fs.rename(src, dest, err => {
      if (err) {
        reject(err);
      } else {
        resolve("Successfully move file:" + dest);
      }
    });
  });
};

// merge file function
export const mergeFiles = async (fileMD5Value, newFileName) => {
  const srcDir = path.resolve(uploadDir, fileMD5Value);

  //get chunks from the file folder
  //sort them to make it is merge correctly
  const chunksArr = await getAllChunks(srcDir);
  chunksArr.sort((x, y) => {
    return x - y;
  });
  console.log(chunksArr);

  //use stream to merge to avoid high consumption of RAM and to handle large file
  const combinedStream = CombinedStream.create();
  for (let i = 0; i < chunksArr.length; i++) {
    //add path directory for each chunk in array, so can be used as path
    chunksArr[i] = path.resolve(srcDir, chunksArr[i]);
    combinedStream.append(next => {
      next(fs.createReadStream(chunksArr[i]));
    });
  }

  const targetFile = fs.createWriteStream(path.resolve(uploadDir, newFileName));
  return new Promise((resolve, reject) => {
    //merge file
    combinedStream.pipe(targetFile).on("finish", () => {
      console.log("Merge Success!");
      // ---------can add in delete chunks folder-----------------
      // ---------to free up disk-----------------
      resolve();
    });
  });
};
