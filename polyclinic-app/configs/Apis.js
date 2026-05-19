import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'http://10.17.64.231:8000/';

export const endpoints = {
    // Auth
    'login':        '/o/token/',
    'register':     '/users/register/',
    'current-user': '/users/current-user/',

    // Pharmacy
    'categories':   '/categories/',
    'medicines':    '/medicines/',
    'medicine-detail': (id) => `/medicines/${id}/`,
    'alerts':       '/medicines/alerts/',
    'stock-transactions': '/stock-transactions/',
    'prescriptions':'/prescriptions/',
    'dispense':     (id) => `/prescriptions/${id}/dispense/`,

    // Billing
    'invoices':     '/invoices/',
    'invoice-detail': (id) => `/invoices/${id}/`,
    'pay-invoice':  (id) => `/invoices/${id}/pay/`,

    // Dashboard
    'dashboard-overview': '/dashboard/overview/',
    'dashboard-revenue':  '/dashboard/revenue/',
    'dashboard-medicines':'/dashboard/medicines/',
    //Appoinment
    'schedules':     '/schedules/',
    'appointment-book': '/appointments/book/',
    //patients
    'patient-profile':   '/patients/profile/',
};

const Apis = axios.create({
    baseURL: BASE_URL,
    timeout: 10000,
});

// Tự động gắn token
export const authApis = async () => {
    // Lấy token động từ bộ nhớ máy
    const token = await AsyncStorage.getItem('access_token'); 
    
    return axios.create({
        baseURL: BASE_URL,
        timeout: 10000,
        headers: { 
            // Nếu có token thì gắn vào, không thì để trống tránh lỗi
            Authorization: token ? `Bearer ${token}` : "" 
        },
    });
};


export default Apis;