import api from './api';

export const getPresentations = () => {
    return api.get('/presentations');
};

export const createPresentation = (title) => {
    return api.post('/presentations/', { title });
};

export const updatePresentation = (id, title) => {
    // Backend menerima judul sebagai query parameter
    return api.put(`/presentations/${id}?title=${encodeURIComponent(title)}`);
};

export const deletePresentation = (id) => {
    return api.delete(`/presentations/${id}`);
};

export const uploadPdf = (id, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/presentations/${id}/upload`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
};

export const createSession = (id) => {
    return api.post(`/presentations/${id}/sessions`);
};