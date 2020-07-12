import crypto from "crypto";
import lz4 from "lz4";
import fs from "fs";
import path from "path";

const appDir = path.dirname(require.main.filename);

export const fileComEnc = async () => {
  //compression stream
  const lz4Encoder = lz4.createEncoderStream();
  lz4Encoder.on("error", (err) => {
    console.log("compression fail", err);
  });

  //encryption stream
  const algorithm = "aes-256-gcm";
  const password = "Password used to generate key";
  const key = crypto.scryptSync(password, "salt", 32);
  const iv = Buffer.alloc(16, 0); // Initialization vector.
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  cipher.on("error", (err) => {
    console.log("encryption fail", err);
  });

  fs.createReadStream(appDir + "/com-enc/test.txt")
    .pipe(lz4Encoder)
    .pipe(cipher)
    .pipe(fs.createWriteStream(appDir + "/com-enc/test-com-enc.txt"));
};

export const fileDecomDec = async () => {
  //compression stream
  const lz4Decoder = lz4.createDecoderStream();
  lz4Decoder.on("error", (err) => {
    console.log("compression fail", err);
  });

  //encryption stream
  const algorithm = "aes-256-gcm";
  const password = "Password used to generate key";
  const key = crypto.scryptSync(password, "salt", 32);
  const iv = Buffer.alloc(16, 0); // Initialization vector.
  const Decipher = crypto.createDecipheriv(algorithm, key, iv);
  Decipher.on("error", (err) => {
    console.log("encryption fail", err);
  });
  fs.createReadStream(appDir + "/com-enc/test-com-enc.txt")
    .pipe(Decipher)
    .pipe(lz4Decoder)
    .pipe(fs.createWriteStream(appDir + "/com-enc/test-deco-dec.txt"));
};
