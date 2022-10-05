const keyFilename = "./free-4abb4-firebase-adminsdk-mfoz6-9687477cb9.json"; //replace this with api key file
const projectId = "free-4abb4"; //replace with your project id
const bucketName = `${projectId}.appspot.com`;
const { Storage } = require("@google-cloud/storage");

// Creates a client
const storage = new Storage({
  keyFilename,
});
// Creates a client from a Google service account key.
// const storage = new Storage({keyFilename: "key.json"});

/**
 * TODO(developer): Uncomment these variables before running the sample.
 */
// const bucketName = 'bucket-name';

const bucket = storage.bucket(bucketName);

async function uploadToFireBaseStorage(filePath, fileMimeType, uploadTo) {
  // const filePath = `./package.json`;
  // const uploadTo = `subfolder/package.json`;

  const { err, file } = await bucket.upload(filePath, {
    destination: uploadTo,
    public: true,
    metadata: { contentType: fileMimeType, cacheControl: "public, max-age=0" },
  });
  if (err) {
    console.log(err);
    return;
  } else {
    return createPublicFileURL(uploadTo);
  }
}

function createPublicFileURL(storageName) {
  return `http://storage.googleapis.com/${bucketName}/${encodeURIComponent(
    storageName
  )}`;
}

module.exports = uploadToFireBaseStorage;
