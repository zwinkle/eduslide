import api from './api';

export const getPresentations = () => {
    return api.get('/presentations');
};

export const getPresentationById = (id) => {
    return api.get(`/presentations/${id}`);
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

export const addQuizActivity = (slideId, quizData) => {
    return api.post(`/presentations/slides/${slideId}/quiz`, quizData);
};

export const addActivityToSlide = (slideId, pollData) => {
    return api.post(`/presentations/slides/${slideId}/activity`, pollData);
};

export const addWordCloudActivity = (slideId, questionData) => {
    return api.post(`/presentations/slides/${slideId}/wordcloud`, questionData);
};

export const createSession = (id) => {
    return api.post(`/presentations/${id}/sessions`);
};