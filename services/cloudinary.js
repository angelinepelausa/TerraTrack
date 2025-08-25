import axios from 'axios';

const CLOUDINARY_URL = 'https://api.cloudinary.com/v1_1/dgdzmrhc4/image/upload';
const UPLOAD_PRESET = 'terratrack';

export const uploadImageToCloudinary = async (uri) => {
  try {
    const formData = new FormData();
    formData.append('file', {
      uri,
      type: 'image/jpeg',
      name: 'task-photo.jpg',
    });
    formData.append('upload_preset', UPLOAD_PRESET);

    const response = await axios.post(CLOUDINARY_URL, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    return response.data.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
};
