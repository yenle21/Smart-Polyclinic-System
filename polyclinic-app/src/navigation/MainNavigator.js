import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';

// Screens Người A
import AppointmentListScreen   from '../screens/appointments/AppointmentListScreen.js';
import SpecialtyListScreen     from '../screens/appointments/SpecialtyListScreen';
import DoctorListScreen        from '../screens/appointments/DoctorListScreen';
import BookingScreen           from '../screens/appointments/BookingScreen';
import AppointmentDetailScreen from '../screens/appointments/AppointmentDetailScreen';
import ProfileScreen           from '../screens/auth/ProfileScreen';
import NotificationScreen      from '../screens/appointments/NotificationScreen';

// Screens Người B
import CategoryListScreen from '../screens/pharmacy/CategoryListScreen';
import MedicineListScreen   from '../screens/pharmacy/MedicineListScreen';
import MedicineDetailScreen from '../screens/pharmacy/MedicineDetailScreen';
import MedicineFormScreen   from '../screens/pharmacy/MedicineFormScreen';
import AlertScreen          from '../screens/pharmacy/AlertScreen';
import InvoiceListScreen    from '../screens/billing/InvoiceListScreen';
import InvoiceDetailScreen  from '../screens/billing/InvoiceDetailScreen';
import PaymentScreen        from '../screens/billing/PaymentScreen';
import DashboardScreen      from '../screens/dashboard/DashboardScreen';

const Tab   = createBottomTabNavigator();
const Stack = createStackNavigator();

const headerOptions = {
    headerStyle:      { backgroundColor: COLORS.primary },
    headerTintColor:  '#fff',
    headerTitleAlign: 'center',
};

function AppointmentStack() {
    return (
        <Stack.Navigator screenOptions={headerOptions}>
            <Stack.Screen name="AppointmentList"   component={AppointmentListScreen}   options={{ title: 'Lịch hẹn của tôi' }} />
            <Stack.Screen name="SpecialtyList"     component={SpecialtyListScreen}     options={{ title: 'Chọn chuyên khoa' }} />
            <Stack.Screen name="DoctorList"        component={DoctorListScreen}        options={{ title: 'Chọn bác sĩ' }} />
            <Stack.Screen name="Booking"           component={BookingScreen}           options={{ title: 'Đặt lịch hẹn' }} />
            <Stack.Screen name="AppointmentDetail" component={AppointmentDetailScreen} options={{ title: 'Chi tiết lịch hẹn' }} />
        </Stack.Navigator>
    );
}

function PharmacyStack() {
    return (
        <Stack.Navigator screenOptions={headerOptions}>
            <Stack.Screen name="CategoryList"   component={CategoryListScreen}   options={{ title: 'Danh mục thuốc' }} />
            <Stack.Screen name="MedicineList"   component={MedicineListScreen}   options={{ title: 'Danh sách thuốc' }} />
            <Stack.Screen name="MedicineDetail" component={MedicineDetailScreen} options={{ title: 'Chi tiết thuốc' }} />
            <Stack.Screen name="MedicineForm"   component={MedicineFormScreen}   options={{ title: 'Thêm / Sửa thuốc' }} />
            <Stack.Screen name="Alert"          component={AlertScreen}          options={{ title: 'Cảnh báo kho' }} />
        </Stack.Navigator>
    );
}

function BillingStack() {
    return (
        <Stack.Navigator screenOptions={headerOptions}>
            <Stack.Screen name="InvoiceList"   component={InvoiceListScreen}   options={{ title: 'Hóa đơn' }} />
            <Stack.Screen name="InvoiceDetail" component={InvoiceDetailScreen} options={{ title: 'Chi tiết hóa đơn' }} />
            <Stack.Screen name="Payment"       component={PaymentScreen}       options={{ title: 'Thanh toán' }} />
        </Stack.Navigator>
    );
}

export default function MainNavigator() {
    console.log('✅ MainNavigator rendered');
    return (
        <Tab.Navigator
            screenOptions={{
                headerShown:           false,
                tabBarActiveTintColor: COLORS.primary,
                tabBarStyle:           { paddingBottom: 5, height: 60 },
            }}
        >
            <Tab.Screen
                name="Appointments"
                component={AppointmentStack}
                options={{
                    tabBarLabel: 'Lịch hẹn',
                    tabBarIcon: ({ color }) => (
                        <MaterialCommunityIcons name="calendar-clock" size={24} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name="Pharmacy"
                component={PharmacyStack}
                options={{
                    tabBarLabel: 'Dược phẩm',
                    tabBarIcon: ({ color }) => (
                        <MaterialCommunityIcons name="pill" size={24} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name="Billing"
                component={BillingStack}
                options={{
                    tabBarLabel: 'Hóa đơn',
                    tabBarIcon: ({ color }) => (
                        <MaterialCommunityIcons name="receipt" size={24} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name="Dashboard"
                component={DashboardScreen}
                options={{
                    tabBarLabel: 'Thống kê',
                    tabBarIcon: ({ color }) => (
                        <MaterialCommunityIcons name="chart-bar" size={24} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name="Profile"
                component={ProfileScreen}
                options={{
                    tabBarLabel: 'Cá nhân',
                    tabBarIcon: ({ color }) => (
                        <MaterialCommunityIcons name="account" size={24} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name="Notifications"
                component={NotificationScreen}
                options={{
                    tabBarLabel: 'Thông báo',
                    tabBarIcon: ({ color }) => (
                        <MaterialCommunityIcons name="bell" size={24} color={color} />
                    ),
                }}
            />
        </Tab.Navigator>
    );
}