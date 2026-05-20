import React, { useEffect, useState } from 'react';

import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    FlatList,
    RefreshControl,
} from 'react-native';

import {
    Card,
    Avatar,
    Chip,
    ActivityIndicator,
} from 'react-native-paper';

import { MaterialCommunityIcons } from '@expo/vector-icons';

import { authApis, endpoints } from '../../configs/Apis';

const DoctorHomeScreen = () => {

    // =========================
    // STATES
    // =========================
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const [doctor, setDoctor] = useState(null);

    const [overview, setOverview] = useState({
        total_appointments: 0,
        pending: 0,
        confirmed: 0,
        completed: 0,
        cancelled: 0,
    });

    const [appointments, setAppointments] = useState([]);

    // =========================
    // LOAD DASHBOARD
    // =========================
    const loadData = async () => {

        try {

            const api = await authApis();

            const res = await api.get(
                endpoints['doctor-dashboard']
            );

            setDoctor(res.data.doctor);

            setOverview(res.data.overview);

            setAppointments(
                res.data.appointments || []
            );

        } catch (err) {

            console.log(
                'DOCTOR DASHBOARD ERROR:',
                err.response?.data || err
            );

        } finally {

            setLoading(false);
            setRefreshing(false);
        }
    };

    // =========================
    // FIRST LOAD
    // =========================
    useEffect(() => {
        loadData();
    }, []);

    // =========================
    // REFRESH
    // =========================
    const onRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    // =========================
    // STATUS COLOR
    // =========================
    const getStatusColor = (status) => {

        switch (status) {

            case 'pending':
                return '#FF9800';

            case 'confirmed':
                return '#2196F3';

            case 'completed':
                return '#4CAF50';

            case 'cancelled':
                return '#F44336';

            default:
                return '#999';
        }
    };

    // =========================
    // STATUS LABEL
    // =========================
    const getStatusLabel = (status) => {

        switch (status) {

            case 'pending':
                return 'Đang chờ';

            case 'confirmed':
                return 'Đã xác nhận';

            case 'completed':
                return 'Đã khám';

            case 'cancelled':
                return 'Đã huỷ';

            default:
                return status;
        }
    };

    // =========================
    // APPOINTMENT ITEM
    // =========================
    const renderAppointment = ({ item }) => (

        <Card style={styles.appointmentCard}>

            <Card.Content>

                <View style={styles.rowBetween}>

                    <View style={{ flex: 1 }}>

                        <Text style={styles.patientName}>
                            {item.patient_name}
                        </Text>

                        <Text style={styles.subText}>
                            🕒 {item.appointment_time}
                        </Text>

                        <Text style={styles.subText}>
                            📋 {item.reason || 'Không có lý do khám'}
                        </Text>

                        <Text style={styles.subText}>
                            💻 {item.type}
                        </Text>

                    </View>

                    <Chip
                        style={{
                            backgroundColor:
                                getStatusColor(item.status),
                        }}
                        textStyle={{
                            color: '#fff',
                        }}
                    >
                        {getStatusLabel(item.status)}
                    </Chip>

                </View>

            </Card.Content>

        </Card>
    );

    // =========================
    // LOADING
    // =========================
    if (loading) {

        return (
            <View style={styles.loadingContainer}>

                <ActivityIndicator
                    size="large"
                    color="#2196F3"
                />

            </View>
        );
    }

    return (

        <ScrollView
            style={styles.container}
            refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                />
            }
        >

            {/* ========================= */}
            {/* HEADER */}
            {/* ========================= */}
            <View style={styles.header}>

                <View>

                    <Text style={styles.greeting}>
                        Xin chào 👋
                    </Text>

                    <Text style={styles.doctorName}>
                        BS. {doctor?.name}
                    </Text>

                </View>

                <Avatar.Icon
                    size={70}
                    icon="doctor"
                    style={{
                        backgroundColor: '#2196F3',
                    }}
                />

            </View>

            {/* ========================= */}
            {/* OVERVIEW */}
            {/* ========================= */}
            <Text style={styles.sectionTitle}>
                Tổng quan hôm nay
            </Text>

            <View style={styles.statsContainer}>

                {/* TOTAL */}
                <Card style={styles.statCard}>

                    <Card.Content style={styles.center}>

                        <MaterialCommunityIcons
                            name="calendar-month"
                            size={32}
                            color="#2196F3"
                        />

                        <Text style={styles.statNumber}>
                            {overview.total_appointments}
                        </Text>

                        <Text style={styles.statLabel}>
                            Tổng lịch
                        </Text>

                    </Card.Content>

                </Card>

                {/* PENDING */}
                <Card style={styles.statCard}>

                    <Card.Content style={styles.center}>

                        <MaterialCommunityIcons
                            name="clock-outline"
                            size={32}
                            color="#FF9800"
                        />

                        <Text style={styles.statNumber}>
                            {overview.pending}
                        </Text>

                        <Text style={styles.statLabel}>
                            Đang chờ
                        </Text>

                    </Card.Content>

                </Card>

                {/* COMPLETED */}
                <Card style={styles.statCard}>

                    <Card.Content style={styles.center}>

                        <MaterialCommunityIcons
                            name="check-circle"
                            size={32}
                            color="#4CAF50"
                        />

                        <Text style={styles.statNumber}>
                            {overview.completed}
                        </Text>

                        <Text style={styles.statLabel}>
                            Đã khám
                        </Text>

                    </Card.Content>

                </Card>

                {/* CANCELLED */}
                <Card style={styles.statCard}>

                    <Card.Content style={styles.center}>

                        <MaterialCommunityIcons
                            name="close-circle"
                            size={32}
                            color="#F44336"
                        />

                        <Text style={styles.statNumber}>
                            {overview.cancelled}
                        </Text>

                        <Text style={styles.statLabel}>
                            Đã huỷ
                        </Text>

                    </Card.Content>

                </Card>

            </View>

            {/* ========================= */}
            {/* APPOINTMENTS */}
            {/* ========================= */}
            <Text style={styles.sectionTitle}>
                Lịch khám hôm nay
            </Text>

            {
                appointments.length === 0 ? (

                    <Card style={styles.emptyCard}>

                        <Card.Content>

                            <Text style={styles.emptyText}>
                                Không có lịch khám hôm nay
                            </Text>

                        </Card.Content>

                    </Card>

                ) : (

                    <FlatList
                        data={appointments}
                        renderItem={renderAppointment}
                        keyExtractor={(item) =>
                            item.id.toString()
                        }
                        scrollEnabled={false}
                    />

                )
            }

        </ScrollView>
    );
};

const styles = StyleSheet.create({

    container: {
        flex: 1,
        backgroundColor: '#F5F7FA',
        padding: 15,
    },

    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },

    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 25,
    },

    greeting: {
        fontSize: 18,
        color: '#777',
    },

    doctorName: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#222',
        marginTop: 5,
    },

    specialty: {
        marginTop: 5,
        color: '#666',
    },

    sectionTitle: {
        fontSize: 21,
        fontWeight: 'bold',
        marginBottom: 15,
        color: '#222',
    },

    statsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },

    statCard: {
        width: '48%',
        marginBottom: 15,
        borderRadius: 16,
    },

    center: {
        alignItems: 'center',
    },

    statNumber: {
        fontSize: 28,
        fontWeight: 'bold',
        marginTop: 10,
    },

    statLabel: {
        marginTop: 5,
        color: '#666',
    },

    appointmentCard: {
        marginBottom: 12,
        borderRadius: 15,
    },

    rowBetween: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },

    patientName: {
        fontSize: 17,
        fontWeight: 'bold',
        color: '#222',
    },

    subText: {
        marginTop: 5,
        color: '#666',
    },

    emptyCard: {
        borderRadius: 15,
    },

    emptyText: {
        textAlign: 'center',
        color: '#777',
    },

});

export default DoctorHomeScreen;