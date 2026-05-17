import axiosClient from './axiosClient';

const pharmacyApi = {
    // Categories
    getCategories:  (params) => axiosClient.get('/categories/', { params }),
    createCategory: (data)   => axiosClient.post('/categories/', data),
    // Medicines
    getMedicines:   (params)   => axiosClient.get('/medicines/', { params }),
    getMedicine:    (id)       => axiosClient.get(`/medicines/${id}/`),
    createMedicine: (data)     => axiosClient.post('/medicines/', data),
    updateMedicine: (id, data) => axiosClient.put(`/medicines/${id}/`, data),
    deleteMedicine: (id)       => axiosClient.delete(`/medicines/${id}/`),
    getAlerts:      ()         => axiosClient.get('/medicines/alerts/'),

    // Transactions
    getTransactions:   (params) => axiosClient.get('/stock-transactions/', { params }),
    createTransaction: (data)   => axiosClient.post('/stock-transactions/', data),

    // Prescriptions
    getPrescriptions:     (params) => axiosClient.get('/prescriptions/', { params }),
    dispensePrescription: (id)     => axiosClient.post(`/prescriptions/${id}/dispense/`),

    // Invoices
    getInvoices:   (params) => axiosClient.get('/invoices/', { params }),
    getInvoice:    (id)     => axiosClient.get(`/invoices/${id}/`),
    payInvoice:    (id)     => axiosClient.post(`/invoices/${id}/pay/`),
};

export default pharmacyApi;