const { PutObjectCommand, S3Client } = require("@aws-sdk/client-s3");
const bucket = process.env.DIGITALOCEAN_BUCKET;
const endpoint = process.env.DIGITALOCEAN_ENDPOINT;

const s3Client = new S3Client({
  endpoint,
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.DIGITALOCEAN_ACCESS_ID,
    secretAccessKey: process.env.DIGITALOCEAN_SECRET_KEY,
  },
});

/**
 * @param {Object} params
 * @returns {Promise<{url: string, data: Object|null, message: string}>}
 */
async function uploadToDigitalOcean(params) {
  const command = new PutObjectCommand(params);
  const response = await s3Client.send(command);

  if (response) {
    return {
      url: `https://${bucket}.sfo3.digitaloceanspaces.com/${params.Key}`,
      data: response,
      message: "Image uploaded successfully",
    };
  } else {
    return {
      url: "",
      data: null,
      message: "Image upload failed",
    };
  }
}

module.exports = {
  uploadToDigitalOcean,
};
