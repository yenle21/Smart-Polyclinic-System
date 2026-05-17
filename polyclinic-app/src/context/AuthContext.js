import React, { createContext, useContext, useState, useEffect } from 'react';
import { saveToken, getToken, clearAll, saveUser, getUser } from '../utils/storage';
import authApi from '../api/authApi';

// Tạo context
const AuthContext = createContext();

// Hook để dùng trong các màn hình
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
    const [user,    setUser]    = useState(null);
    const [token,   setToken]   = useState(null);
    const [loading, setLoading] = useState(true); // đang kiểm tra token cũ

    // Khi app khởi động — kiểm tra đã đăng nhập chưa
    useEffect(() => {
        checkLogin();
    }, []);

    const checkLogin = async () => {
        try {
            const savedToken = await getToken();
            const savedUser  = await getUser();
            if (savedToken && savedUser) {
                setToken(savedToken);
                setUser(savedUser);
            }
        } catch (err) {
            console.log('Chưa đăng nhập');
        } finally {
            setLoading(false);
        }
    };

    const login = async (username, password) => {
        const res = await authApi.login({ username, password });
        // Lưu token
        await saveToken(res.access_token);
        setToken(res.access_token);
        // Lấy thông tin user
        const me = await authApi.getMe();
        await saveUser(me);
        setUser(me);
    };

    const logout = async () => {
        await clearAll();
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}