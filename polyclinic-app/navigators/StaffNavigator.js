import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import COLORS from '../styles/colors';
import AppHeader from '../components/shared/AppHeader';

// Pharmacy
import CategoryListScreen       from '../screens/staff/CategoryScreen';
import MedicineListScreen       from '../screens/staff/MedicineListScreen';
import MedicineDetailScreen     from '../screens/staff/MedicineDetailScreen';
import AlertScreen              from '../screens/staff/AlertScreen';
import StockTransactionScreen   from '../screens/staff/StockTransactionScreen';
import PrescriptionScreen       from '../screens/staff/PrescriptionScreen';
import PrescriptionDetailScreen from '../screens/staff/PrescriptionDetailScreen';


// Reception
import AppointmentListScreen from '../screens/staff/AppointmentListScreen';
import AppointmentDetailScreen from '../screens/staff/AppointmentDetailScreen';
import InvoiceDetailScreen   from '../screens/staff/InvoiceDetailScreen';
import InvoiceListScreen     from '../screens/staff/InvoiceListScreen';

// Shared
import ProfileScreen from '../screens/shared/ProfileScreen';

const Tab   = createBottomTabNavigator();
const Stack = createStackNavigator();


const headerOptions = {
    header: ({ navigation, route, options }) => (
        <AppHeader
            title={options.title || route.name}
            onBack={navigation.canGoBack() ? () => navigation.goBack() : null}
        />
    ),
};
function AppointmentStack() {
    return (
        <Stack.Navigator screenOptions={headerOptions}>
            <Stack.Screen name="AppointmentList" component={AppointmentListScreen} options={{ title: 'Quản lý lịch hẹn' }} />
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
            <Stack.Screen name="StockTransaction" component={StockTransactionScreen} options={{ title: 'Quản lý kho' }} />
            <Stack.Screen name="Alert"          component={AlertScreen}          options={{ title: 'Cảnh báo kho' }} />
        </Stack.Navigator>
    );
}

function PrescriptionStack() {
    return (
        <Stack.Navigator screenOptions={headerOptions}>
            <Stack.Screen name="PrescriptionList"   component={PrescriptionScreen}       options={{ title: 'Đơn thuốc' }} />
            <Stack.Screen name="PrescriptionDetail" component={PrescriptionDetailScreen} options={{ title: 'Chi tiết đơn thuốc' }} />
        </Stack.Navigator>
    );
}

function InvoiceStack() {
    return (
        <Stack.Navigator screenOptions={headerOptions}>
            <Stack.Screen name="InvoiceList"   component={InvoiceListScreen}   options={{ title: 'Hóa đơn' }} />
            <Stack.Screen name="InvoiceDetail" component={InvoiceDetailScreen} options={{ title: 'Chi tiết hóa đơn' }} />
        </Stack.Navigator>
    );
}

export default function StaffNavigator() {
    return (
        <Tab.Navigator screenOptions={{
            headerShown:           false,
            tabBarActiveTintColor: COLORS.primary,
            tabBarStyle:           { paddingBottom: 5, height: 60 },
        }}>
            <Tab.Screen
                name="AppointmentTab"
                component={AppointmentStack}
                options={{
                    tabBarLabel: 'Lịch hẹn',
                    tabBarIcon: ({ color }) => <MaterialCommunityIcons name="calendar-check" size={24} color={color} />,
                }}
            />
            <Tab.Screen
                name="PharmacyTab"
                component={PharmacyStack}
                options={{
                    tabBarLabel: 'Dược phẩm',
                    tabBarIcon: ({ color }) => <MaterialCommunityIcons name="pill" size={24} color={color} />,
                }}
            />
            <Tab.Screen
                name="PrescriptionTab"
                component={PrescriptionStack}
                options={{
                    tabBarLabel: 'Đơn thuốc',
                    tabBarIcon: ({ color }) => <MaterialCommunityIcons name="file-document" size={24} color={color} />,
                }}
            />
            <Tab.Screen
                name="InvoiceTab"
                component={InvoiceStack}
                options={{
                    tabBarLabel: 'Thanh toán',
                    tabBarIcon: ({ color }) => <MaterialCommunityIcons name="receipt" size={24} color={color} />,
                }}
            />
            <Tab.Screen
                name="ProfileTab"
                component={ProfileScreen}
                options={{
                    tabBarLabel: 'Cá nhân',
                    tabBarIcon: ({ color }) => <MaterialCommunityIcons name="account" size={24} color={color} />,
                }}
            />
        </Tab.Navigator>
    );
}