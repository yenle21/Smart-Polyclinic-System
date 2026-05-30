import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'http://192.168.1.253:8000';

export const endpoints = {
    // Auth
    'login':        '/o/token/',
    'register':     '/users/',
    'current-user': '/users/current-user/',
    'create-doctor':  '/users/create-doctor/',
    'create-staff':   '/users/create-staff/',
    'create-pharmacy': '/users/create-pharmacy/',
    'specialties':    '/specialties/',
    'google-login': '/auth/google/',

    // Pharmacy
    'categories':   '/categories/',
    'alerts':       '/medicines/alerts/',
    'inventory':          '/inventory/',
    'stock-transactions': '/stock-transactions/',
    'prescriptions':'/prescriptions/',
    'dispense':     (id) => `/prescriptions/${id}/dispense/`,

    // Billing
    'invoices':     '/invoices/',
    'invoice-detail': (id) => `/invoices/${id}/`,
    'pay-invoice':  (id) => `/invoices/${id}/pay/`,
    'vnpay-return':      '/invoices/vnpay-return/',   
    'momo-return':       '/invoices/momo-return/',   
    'momo-ipn':          '/invoices/momo-ipn/', 

    //Appoinment
    'schedules':'/schedules/',
    'schedules-detail':   (id) => `/schedules/${id}/`,
    'appointments':'/appointments/',
    'appointment-book': '/appointments/book/',
    'complete-appointment': (id) => `/appointments/${id}/complete/`,
    'appointment-detail':   (id) => `/appointments/${id}/`,
    'appointment-cancel':   (id) => `/appointments/${id}/cancel/`,
    'appointment-change-schedule': (id) => `/appointments/${id}/change-schedule/`,
    'no-show-appointment': (id) => `/appointments/${id}/no-show/`,
    //patients
    'patient-profile':   '/patients/profile/',
    //dashboard
    'dashboard-overview': '/overview/',
    'dashboard-revenue':  '/revenue/',
    'dashboard-medicines':'/medicines-report/',
    'doctor-dashboard': '/doctor/dashboard/',
    'patients-report': '/patients-report/',
    'disease-report':  '/disease-report/',
    //medical-record
    'medical-records' :'/medical-records/',
    'medical-detail':   (id) => `/medical-records/${id}/detail/`,
    'medical-create-record':   `/medical-records/create/`,
    'update-medical-record': (id) => `/medical-records/${id}/update-record/`,
    'test-results':         (id) => `/medical-records/${id}/test-results/`,
    'medicines':            '/medicines/',
    'medicine-detail': (id) => `/medicines/${id}/`,
    //Noti
    'notifications':       '/notifications/',
    'notification-read':   (id) => `/notifications/${id}/read/`,
    'notifications-read-all': '/notifications/read-all/',

}
const Apis = axios.create({
    baseURL: BASE_URL,
    timeout: 10000,
});

// Tự động gắn token
export const authApis = async () => {
    const token = await AsyncStorage.getItem('access_token');

    return axios.create({
        baseURL: BASE_URL,
        timeout: 10000,
        headers: token
            ? { Authorization: `Bearer ${token}` }
            : {},
    });
};

export const uploadApis = async () => {
    const token = await AsyncStorage.getItem('access_token');
    return axios.create({
        baseURL: BASE_URL,
        timeout: 30000, 
        headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
};

export default Apis;