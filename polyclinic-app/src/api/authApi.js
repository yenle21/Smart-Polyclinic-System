import axiosClient from './axiosClient';

const authApi = {
    // Đăng nhập → trả về access_token
    login: (data) => axiosClient.post('/o/token/', {
        ...data,
        grant_type:    'password',
        client_id:     'your-client-id',      // lấy từ Django Admin → OAuth2 Applications
        client_secret: 'your-client-secret',  // lấy từ Django Admin → OAuth2 Applications
    }),

    // Đăng ký tài khoản mới
    register: (data) => axiosClient.post('/api/accounts/register/', data),

    // Lấy thông tin user đang đăng nhập
    getMe: () => axiosClient.get('/api/accounts/me/'),

    // Cập nhật profile
    updateProfile: (data) => axiosClient.patch('/api/accounts/me/', data),

    // Đăng nhập Google
    loginGoogle: (token) => axiosClient.post('/auth/convert-token/', {
        token,
        backend:       'google-oauth2',
        grant_type:    'convert_token',
        client_id:     'your-client-id',
        client_secret: 'your-client-secret',
    }),
};

export default authApi;