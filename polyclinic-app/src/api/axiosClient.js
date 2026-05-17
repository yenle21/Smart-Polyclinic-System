import axios from 'axios';
import { BASE_URL } from '../constants/config';
import { getToken, removeToken } from '../utils/storage';

const axiosClient = axios.create({
    baseURL: BASE_URL,
    timeout: 10000,
    headers: { 'Content-Type': 'application/json' },
});

// Tự động gắn token vào mỗi request
axiosClient.interceptors.request.use(
    async (config) => {
        const token = await getToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Xử lý lỗi response
axiosClient.interceptors.response.use(
    (response) => response.data,
    async (error) => {
        const status  = error.response?.status;
        const message = error.response?.data?.detail
                     || error.response?.data?.message
                     || 'Có lỗi xảy ra';

        // Token hết hạn → xóa token, về màn hình login
        if (status === 401) {
            await removeToken();
        }

        return Promise.reject(message);
    }
);

export default axiosClient;