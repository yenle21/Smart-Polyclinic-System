import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import COLORS from '../styles/colors';

// Pharmacy screens
import StockTransactionScreen   from '../screens/pharmacy/StockTransactionScreen';
import PrescriptionDetailScreen from '../screens/pharmacy/PrescriptionDetailScreen';
import InvoiceListScreen        from '../screens/pharmacy/InvoiceListScreen';

// Reception screens
import AppointmentListScreen   from '../screens/reception/AppointmentListScreen';
import PatientManagementScreen from '../screens/reception/PatientManagementScreen';
import InvoiceDetailScreen     from '../screens/reception/InvoiceDetailScreen';
import PreConsultScreen        from '../screens/reception/PreConsultScreen';
import NotificationScreen      from '../screens/reception/NotificationScreen';

// Lab screens
import LabRequestScreen      from '../screens/lab/LabRequestScreen';
import LabResultUpdateScreen from '../screens/lab/LabResultUpdateScreen';
import MedicalRecordScreen   from '../screens/lab/MedicalRecordScreen';

// Shared
import ProfileScreen from '../screens/shared/ProfileScreen';

const Tab   = createBottomTabNavigator();
const Stack = createStackNavigator();

const headerOptions = {
    headerStyle:      { backgroundColor: COLORS.primary },
    headerTintColor:  '#fff',
    headerTitleAlign: 'center',
};

function MedicineStack() {
    return (
        <Stack.Navigator screenOptions={headerOptions}>
            <Stack.Screen name="CategoryList"   component={CategoryListScreen}   options={{ title: 'Danh mục thuốc' }} />
            <Stack.Screen name="MedicineList"   component={MedicineListScreen}   options={{ title: 'Danh sách thuốc' }} />
            <Stack.Screen name="MedicineDetail" component={MedicineDetailScreen} options={{ title: 'Chi tiết thuốc' }} />
            <Stack.Screen name="Alert"          component={AlertScreen}          options={{ title: 'Cảnh báo kho' }} />
        </Stack.Navigator>
    );
}

function AppointmentStack() {
    return (
        <Stack.Navigator screenOptions={headerOptions}>
            <Stack.Screen name="AppointmentList"   component={AppointmentListScreen}   options={{ title: 'Lịch hẹn' }} />
            <Stack.Screen name="PatientManagement" component={PatientManagementScreen} options={{ title: 'Quản lý bệnh nhân' }} />
            <Stack.Screen name="InvoiceDetail"     component={InvoiceDetailScreen}     options={{ title: 'Hóa đơn' }} />
        </Stack.Navigator>
    );
}

function LabStack() {
    return (
        <Stack.Navigator screenOptions={headerOptions}>
            <Stack.Screen name="LabRequest"      component={LabRequestScreen}      options={{ title: 'Yêu cầu xét nghiệm' }} />
            <Stack.Screen name="LabResultUpdate" component={LabResultUpdateScreen} options={{ title: 'Cập nhật kết quả' }} />
            <Stack.Screen name="MedicalRecord"   component={MedicalRecordScreen}   options={{ title: 'Hồ sơ bệnh án' }} />
        </Stack.Navigator>
    );
}

export default function StaffNavigator() {
    return (
        <Tab.Navigator screenOptions={{ headerShown: false, tabBarActiveTintColor: COLORS.primary, tabBarStyle: { paddingBottom: 5, height: 60 } }}>
            
            <Tab.Screen
                name="AppointmentTab"
                component={AppointmentStack}
                options={{ tabBarLabel: 'Lịch hẹn', tabBarIcon: ({ color }) => <MaterialCommunityIcons name="calendar-check" size={24} color={color} /> }}
            />
            <Tab.Screen
                name="LabTab"
                component={LabStack}
                options={{ tabBarLabel: 'Xét nghiệm', tabBarIcon: ({ color }) => <MaterialCommunityIcons name="test-tube" size={24} color={color} /> }}
            />
            
            <Tab.Screen
                name="PrescriptionTab"
                component={PrescriptionDetailScreen}
                options={{ tabBarLabel: 'Đơn thuốc', tabBarIcon: ({ color }) => <MaterialCommunityIcons name="file-document" size={24} color={color} /> }}
            />
            <Tab.Screen
                name="InvoiceTab"
                component={InvoiceListScreen}
                options={{ tabBarLabel: 'Hóa đơn', tabBarIcon: ({ color }) => <MaterialCommunityIcons name="receipt" size={24} color={color} /> }}
            />
            <Tab.Screen
                name="ConsultTab"
                component={PreConsultScreen}
                options={{ tabBarLabel: 'Tư vấn', tabBarIcon: ({ color }) => <MaterialCommunityIcons name="chat" size={24} color={color} /> }}
            />
            
            <Tab.Screen
                name="ProfileTab"
                component={ProfileScreen}
                options={{ tabBarLabel: 'Cá nhân', tabBarIcon: ({ color }) => <MaterialCommunityIcons name="account" size={24} color={color} /> }}
            />
        </Tab.Navigator>
    );
}