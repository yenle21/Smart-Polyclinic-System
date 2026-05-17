import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen    from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import { COLORS } from '../constants/colors';

const Stack = createStackNavigator();

export default function AuthNavigator() {
    return (
        <Stack.Navigator
            screenOptions={{
                headerStyle:      { backgroundColor: COLORS.primary },
                headerTintColor:  '#fff',
                headerTitleAlign: 'center',
            }}
        >
            <Stack.Screen
                name="Login"
                component={LoginScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="Register"
                component={RegisterScreen}
                options={{ title: 'Đăng ký tài khoản' }}
            />
        </Stack.Navigator>
    );
}