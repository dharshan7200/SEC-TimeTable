import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
});

export const uploadPDF = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
    return response.data;
};

export const uploadText = async (text) => {
    const response = await api.post('/upload-text', { text });
    return response.data;
};

export const generateTimetable = async (preferences) => {
    const response = await api.post('/generate', preferences);
    return response.data;
};

export const checkCompatibility = async (preferences) => {
    const response = await api.post('/check-compatibility', preferences);
    return response.data;
};

export default api;
