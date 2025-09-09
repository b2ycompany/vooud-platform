/* eslint-disable max-len */
/* eslint-disable object-curly-spacing */
/* eslint-disable indent */
/* eslint-disable new-cap */

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors")({origin: true});
const Busboy = require("busboy");

admin.initializeApp();
const storage = admin.storage();

// Nome correto do bucket, como verificado anteriormente
const bucketName = "vooud-joias-platform.firebasestorage.app";

exports.uploadImage = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    if (req.method !== "POST") {
      return res.status(405).end();
    }

    const busboy = Busboy({headers: req.headers});
    const uploads = {};
    const joiaId = req.query.joiaId;

    if (!joiaId) {
      return res.status(400).json({error: "joiaId é obrigatório."});
    }

    busboy.on("file", (fieldname, file, filename, encoding, mimetype) => {
      const filepath = `joias/${joiaId}/${filename.filename}`;
      // --- CORREÇÃO APLICADA AQUI ---
      const uploadStream = storage.bucket(bucketName).file(filepath).createWriteStream();
      file.pipe(uploadStream);
      uploads[filename.filename] = uploadStream;
    });

    busboy.on("finish", () => {
      Promise.all(Object.values(uploads).map((upload) =>
        new Promise((resolve, reject) => {
          upload.on("finish", resolve);
          upload.on("error", reject);
        }),
      ))
      .then(() => {
        const fileUploadPromises = [];
        for (const filename in uploads) {
          if (Object.prototype.hasOwnProperty.call(uploads, filename)) {
            const file = storage.bucket(bucketName).file(`joias/${joiaId}/${filename}`);
            fileUploadPromises.push(file.makePublic());
          }
        }
        return Promise.all(fileUploadPromises);
      })
      .then(() => {
        const firstFile = Object.keys(uploads)[0];
        // --- CORREÇÃO APLICADA AQUI TAMBÉM ---
        const publicUrl = `https://storage.googleapis.com/${bucketName}/joias/${joiaId}/${firstFile}`;
        res.status(200).json({imageUrl: publicUrl});
      })
      .catch((err) => {
        console.error("Erro no processo de upload:", err);
        res.status(500).json({error: err.message});
      });
    });

    busboy.end(req.rawBody);
  });
});
