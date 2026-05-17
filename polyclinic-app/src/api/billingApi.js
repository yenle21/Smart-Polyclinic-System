import axiosClient from './axiosClient';

const dashboardApi = {
    getOverview: ()       => axiosClient.get('/dashboard/overview/'),
    getRevenue:  (params) => axiosClient.get('/dashboard/revenue/', { params }),
    getMedicineReport: () => axiosClient.get('/dashboard/medicines/'),
};

export default dashboardApi;