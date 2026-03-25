import { UploadApiResponse } from "cloudinary";
import cloudinary from "../lib/cloudinary";

export const addCloudinaryImage = async (
  image: Buffer,
  folder: string,
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder },
      (error, result) => {
        if (error || !result) {
          return reject(error || new Error("Upload failed"));
        }

        resolve(result.secure_url);
      },
    );

    stream.end(image);
  });
};

export const deleteCloudinaryImage = async (
  publicId: string,
  folder: string,
): Promise<void> => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(`${folder}/${publicId}`, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });
  });
};
