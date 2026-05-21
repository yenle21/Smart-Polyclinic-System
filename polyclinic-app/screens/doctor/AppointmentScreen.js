import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, FlatList, StyleSheet,
    ActivityIndicator, RefreshControl, TouchableOpacity,
} from 'react-native';
import { authApis, endpoints } from '../../configs/Apis';

const AppointmentScreen = ({ navigation }) => {

    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading]           = useState(true);
    const [refreshing, setRefreshing]     = useState(false);

    const loadAppointments = async () => {
        try {
            const api  = await authApis();
            const res  = await api.get(endpoints['appointments']);
            const data = res.data;
            const list = (Array.isArray(data) ? data : (data.results || []))
                .filter(item => item.status !== 'cancelled');
            setAppointments(list);
        } catch (err) {
            console.log('LOAD APPOINTMENTS ERROR:', err.response?.data || err);
            setAppointments([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => { loadAppointments(); }, []);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadAppointments();
    }, []);

    const getStatusStyle = (status) => ({
        confirmed: styles.badgeConfirmed,
        cancelled: styles.badgeCancelled,
        no_show:   styles.badgeNoShow,
        completed: styles.badgeCompleted,
        pending:   styles.badgePending,
    }[status] || styles.badgePending);

    const getStatusLabel = (status) => ({
        confirmed: 'Đã xác nhận',
        cancelled: 'Đã huỷ',
        no_show:   'Vắng mặt',
        completed: 'Đã khám xong',
        pending:   'Chờ xác nhận',
    }[status] || 'Chờ xác nhận');

    const renderItem = ({ item }) => (
        <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => navigation.navigate('AppointmentDetail', { appointment: item })}
        >
            <View style={styles.card}>

                {/* HEADER */}
                <View style={styles.headerRow}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>
                            {(item.patient_name || 'U')[0].toUpperCase()}
                        </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.name}>
                            {item.patient_name || 'Unknown Patient'}
                        </Text>
                        <Text style={styles.specialty}>{item.specialty_name}</Text>
                    </View>
                    <View style={[styles.badge, getStatusStyle(item.status)]}>
                        <Text style={styles.badgeText}>{getStatusLabel(item.status)}</Text>
                    </View>
                </View>

                {/* BODY */}
                <View style={styles.infoBox}>
                    <Text style={styles.infoText}>📅 {item.work_date}</Text>
                    <Text style={styles.infoText}>🕒 {item.appointment_time}</Text>
                    <Text style={styles.type}>
                        {item.type === 'online' ? '💻 Khám online' : '🏥 Khám tại phòng khám'}
                    </Text>
                </View>

            </View>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" />
                <Text>Đang tải lịch khám...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={appointments}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderItem}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                ListEmptyComponent={
                    <View style={styles.center}>
                        <Text>Không có lịch khám</Text>
                    </View>
                }
            />
        </View>
    );
};

export default AppointmentScreen;

const styles = StyleSheet.create({
    container:      { flex: 1, backgroundColor: '#F5F6FA', padding: 12 },
    card:           { backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
    headerRow:      { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    avatar:         { width: 42, height: 42, borderRadius: 21, backgroundColor: '#E8F0FE', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
    avatarText:     { fontWeight: 'bold', color: '#2F6FED' },
    name:           { fontSize: 15, fontWeight: '700', color: '#111' },
    specialty:      { fontSize: 13, color: '#666', marginTop: 2 },
    infoBox:        { marginTop: 8, gap: 4 },
    infoText:       { fontSize: 13, color: '#333' },
    type:           { fontSize: 13, marginTop: 4, color: '#2F6FED', fontWeight: '600' },
    badge:          { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    badgeText:      { fontSize: 11, fontWeight: '600', color: '#fff' },
    badgeConfirmed: { backgroundColor: '#22C55E' },
    badgeCancelled: { backgroundColor: '#EF4444' },
    badgePending:   { backgroundColor: '#F59E0B' },
    badgeNoShow:    { backgroundColor: '#6B7280' },
    badgeCompleted: { backgroundColor: '#2196F3' },
    center:         { flex: 1, justifyContent: 'center', alignItems: 'center' },
});