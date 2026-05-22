import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import COLORS from '../styles/colors';

// ── Screens ──
import RevenueReportScreen  from '../screens/admin/RevenueReportScreen';
import MedicineReportScreen from '../screens/admin/MedicineReportScreen';
import AlertScreen          from '../screens/pharmacy/AlertScreen';
import ProfileScreen        from '../screens/shared/ProfileScreen';
import PatientReportScreen from '../screens/admin/PatientReportScreen';
import DiseaseReportScreen from '../screens/admin/DiseaseReportScreen';
import CreateAccountScreen from '../screens/admin/CreateAccountScreen';

const Tab   = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const headerOpts = {
    headerTintColor: '#fff',                          
    headerStyle: { backgroundColor: COLORS.primary },
    headerTitleStyle: { fontWeight: 'bold' },
};

function RevenueStack() {
    return (
        <Stack.Navigator screenOptions={headerOpts}>
            <Stack.Screen name="RevenueReport" component={RevenueReportScreen}
                          options={{ title: 'Báo cáo doanh thu' }} />
        </Stack.Navigator>
    );
}

function MedicineStack() {
    return (
        <Stack.Navigator screenOptions={headerOpts}>
            <Stack.Screen name="MedicineReport" component={MedicineReportScreen}
                          options={{ title: 'Báo cáo dược phẩm' }} />
        </Stack.Navigator>
    );
}

function PatientStack() {
    return (
        <Stack.Navigator screenOptions={headerOpts}>
            <Stack.Screen name="PatientReport" component={PatientReportScreen}
                          options={{ title: 'Báo cáo bệnh nhân' }} />
        </Stack.Navigator>
    );
}

function DiseaseStack() {
    return (
        <Stack.Navigator screenOptions={headerOpts}>
            <Stack.Screen name="DiseaseReport" component={DiseaseReportScreen}
                          options={{ title: 'Báo cáo bệnh phổ biến' }} />
        </Stack.Navigator>
    );
}

function AccountStack() {
    return (
        <Stack.Navigator screenOptions={headerOpts}>
            <Stack.Screen name="CreateAccount" component={CreateAccountScreen}
                          options={{ title: 'Tạo tài khoản' }} />
        </Stack.Navigator>
    );
}

function AlertStack() {
    return (
        <Stack.Navigator screenOptions={headerOpts}>
            <Stack.Screen name="AlertHome" component={AlertScreen}
                          options={{ title: 'Cảnh báo kho' }} />
        </Stack.Navigator>
    );
}

function ProfileStack() {
    return (
        <Stack.Navigator screenOptions={headerOpts}>
            <Stack.Screen name="ProfileHome" component={ProfileScreen}
                          options={{ title: 'Hồ sơ cá nhân' }} />
        </Stack.Navigator>
    );
}

function TabIcon({ name, color, size }) {
    return <MaterialCommunityIcons name={name} size={size} color={color} />;
}

export default function AdminNavigator() {
    return (
        <Tab.Navigator
            screenOptions={{
                headerShown:             false,
                tabBarActiveTintColor:   COLORS.primary,
                tabBarInactiveTintColor: '#9CA3AF',
                tabBarStyle: {
                    backgroundColor: '#fff',
                    borderTopColor:  '#E5E7EB',
                    borderTopWidth:  1,
                    paddingBottom:   6,
                    paddingTop:      4,
                    height:          60,
                },
                tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
            }}
        >
            <Tab.Screen
                name="Revenue"
                component={RevenueStack}
                options={{
                    title: 'Doanh thu',
                    tabBarIcon: ({ color, size }) =>
                        <TabIcon name="chart-bar" color={color} size={size} />,
                }}
            />

            <Tab.Screen
                name="MedicineRpt"
                component={MedicineStack}
                options={{
                    title: 'Dược phẩm',
                    tabBarIcon: ({ color, size }) =>
                        <TabIcon name="pill" color={color} size={size} />,
                }}
            />

            <Tab.Screen name="PatientRpt" component={PatientStack}
                options={{
                    title: 'Bệnh nhân',
                    tabBarIcon: ({ color, size }) =>
                        <TabIcon name="account-group" color={color} size={size} />,
                }} />

            <Tab.Screen name="DiseaseRpt" component={DiseaseStack}
                options={{
                    title: 'Bệnh phổ biến',
                    tabBarIcon: ({ color, size }) =>
                        <TabIcon name="virus" color={color} size={size} />,
                }} />

            <Tab.Screen
                name="Alerts"
                component={AlertStack}
                options={{
                    title: 'Cảnh báo',
                    tabBarIcon: ({ color, size }) =>
                        <TabIcon name="bell-alert" color={color} size={size} />,
                }}
            />

            <Tab.Screen name="AccountTab" component={AccountStack}
                options={{
                    title: 'Tài khoản',
                    tabBarIcon: ({ color, size }) =>
                        <TabIcon name="account-plus" color={color} size={size} />,
                }} />

            <Tab.Screen
                name="Profile"
                component={ProfileStack}
                options={{
                    title: 'Cá nhân',
                    tabBarIcon: ({ color, size }) =>
                        <TabIcon name="account-circle" color={color} size={size} />,
                }}
            />
        </Tab.Navigator>
    );
}