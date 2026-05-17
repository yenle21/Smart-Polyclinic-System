import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';

export default function AppNavigator() {
    const { user, loading } = useAuth();

    // Đang kiểm tra token → hiện loading
    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#1D9E75" />
            </View>
        );
    }

    return (
        <NavigationContainer>
            {/* Chưa đăng nhập → AuthNavigator, đã đăng nhập → MainNavigator */}
            {/* {user ? <MainNavigator /> : <AuthNavigator />} */}
            {true ? <MainNavigator /> : <AuthNavigator />}
        </NavigationContainer>
    );
}