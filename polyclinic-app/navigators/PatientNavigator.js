import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import { IconButton } from 'react-native-paper';

// Các màn hình Demo tạm thời cho Bệnh nhân (Bạn có thể tách thành các file riêng sau)
const PatientHomeScreen = () => (
    <View style={styles.center}><Text style={styles.text}>🏠 Trang chủ Bệnh nhân</Text></View>
);
const AppointmentScreen = () => (
    <View style={styles.center}><Text style={styles.text}>📅 Đặt lịch & Quản lý lịch hẹn</Text></View>
);
const PatientProfileScreen = () => (
    <View style={styles.center}><Text style={styles.text}>🧑‍⚕️ Hồ sơ sức khỏe cá nhân</Text></View>
);

const Tab = createBottomTabNavigator();

const PatientNavigator = () => {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ color, size }) => {
                    let iconName;
                    if (route.name === 'PatientHome') iconName = 'home';
                    else if (route.name === 'Appointments') iconName = 'calendar';
                    else if (route.name === 'PatientProfile') iconName = 'account';

                    return <IconButton icon={iconName} size={size} iconColor={color} />;
                },
                tabBarActiveTintColor: '#2196F3',
                tabBarInactiveTintColor: 'gray',
                headerShown: true,
            })}
        >
            <Tab.Screen 
                name="PatientHome" 
                component={PatientHomeScreen} 
                options={{ title: 'Trang chủ' }} 
            />
            <Tab.Screen 
                name="Appointments" 
                component={AppointmentScreen} 
                options={{ title: 'Lịch hẹn' }} 
            />
            <Tab.Screen 
                name="PatientProfile" 
                component={PatientProfileScreen} 
                options={{ title: 'Hồ sơ' }} 
            />
        </Tab.Navigator>
    );
};

const styles = StyleSheet.create({
center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9f9f9' },    text: { fontSize: 18, fontWeight: 'bold', color: '#333' }
});

// BẮT BUỘC PHẢI CÓ DÒNG NÀY ĐỂ APP.JS KHÔNG BỊ LỖI CRASH
export default PatientNavigator;