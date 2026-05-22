import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';


const BASE_URL = 'http://10.17.65.73:8000';



export const endpoints = {
    // Auth
    'login':        '/o/token/',
    'register':     '/users/register/',
    'current-user': '/users/current-user/',
    'create-doctor':  '/users/create-doctor/',
    'create-staff':   '/users/create-staff/',
    'specialties':    '/specialties/',

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

    //Appoinment
    'schedules':'/schedules/',
    'schedules-detail':   (id) => `/schedules/${id}/`,
    'appointments':'/appointments/',
    'appointment-book': '/appointments/book/',
    'complete-appointment': (id) => `/appointments/${id}/complete/`,
    'appointment-detail':   (id) => `/appointments/${id}/`,
    'appointment-cancel':   (id) => `/appointments/${id}/cancel/`,
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
    'prescriptions':        '/prescriptions/',
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