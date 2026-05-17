import axios from 'axios';
import { BASE_URL, TIMEOUT } from './constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

const api = axios.create({
    baseURL: BASE_URL,
    timeout: TIMEOUT,
    headers: { 'Content-Type': 'application/json' },
});

// Tự động gắn token
api.interceptors.request.use(async (config) => {
    const token = '1HQP0KQlfbJINwgFW1T8yfcLjUui5y';
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// Xử lý lỗi chung
api.interceptors.response.use(
    (res) => res.data,
    (err) => {
        const msg = err.response?.data?.detail
                 || err.response?.data?.message
                 || 'Có lỗi xảy ra';
        if (err.response?.status === 401) {
            AsyncStorage.removeItem('access_token');
        }
        return Promise.reject(msg);
    }
);

export default api;