import { DeleteObjectCommand, ListObjectsV2Command, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

const r2 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const BUCKET = process.env.R2_BUCKET;
const PUBLIC_URL = process.env.R2_PUBLIC_URL;

export const uploadToR2 = async (file) => {
  const key = `${Date.now()}-${file.originalname}`;
  await r2.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
    ACL: 'public-read',
  }));
  return `${PUBLIC_URL}/${key}`;
};

export const deleteFromR2 = async (key) => {
  await r2.send(new DeleteObjectCommand({
    Bucket: BUCKET,
    Key: key,
  }));
};

export const listR2Images = async () => {
  const { Contents = [] } = await r2.send(new ListObjectsV2Command({ Bucket: BUCKET }));
  return Contents.map(obj => ({
    key: obj.Key,
    url: `${PUBLIC_URL}/${obj.Key}`
  }));
};
