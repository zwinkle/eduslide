import api from './api';

export const validateSession = (sessionCode) => {
    return api.get(`/sessions/${sessionCode}`);
};