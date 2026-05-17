import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Apis, { authApis, endpoints } from '../configs/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user,    setUser]    = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadUser();
    }, []);

    const loadUser = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            if (token) {
                const api = await authApis();
                const res = await api.get(endpoints['current-user']);
                setUser(res.data);
            }
        } catch (err) {
            await AsyncStorage.removeItem('token');
        } finally {
            setLoading(false);
        }
    };

    const login = async (username, password, clientId, clientSecret) => {
        const params = new URLSearchParams({
            grant_type:    'password',
            username,
            password,
            client_id:     clientId,
            client_secret: clientSecret,
        });

        const res = await Apis.post(endpoints['login'], params.toString(), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });

        await AsyncStorage.setItem('token', res.data.access_token);

        const api     = await authApis();
        const userRes = await api.get(endpoints['current-user']);
        setUser(userRes.data);

        return userRes.data;
    };

    const logout = async () => {
        await AsyncStorage.removeItem('token');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);