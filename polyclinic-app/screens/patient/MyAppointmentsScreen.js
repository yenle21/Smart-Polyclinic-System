import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, ScrollView,
    ActivityIndicator, TouchableOpacity, Alert,
} from 'react-native';
import { Card, Chip, Button } from 'react-native-paper';
import { authApis, endpoints } from '../../configs/Apis';

const STATUS_COLOR = {
    pending:   '#FF9800',
    confirmed: '#4CAF50',
    cancelled: '#F44336',
    completed: '#2196F3',
};

const STATUS_LABEL = {
    pending:   'Chờ duyệt',
    confirmed: 'Đã duyệt',
    cancelled: 'Đã hủy',
    completed: 'Hoàn thành',
};

const MyAppointmentsScreen = ({ navigation }) => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(false);

    const loadAppointments = useCallback(async () => {
        try {
            setLoading(true);
            const api = await authApis();
            const res = await api.get(endpoints['appointments']);
            const data = Array.isArray(res.data)
                ? res.data
                : (res.data.results ?? []);
            setAppointments(data);
        } catch (ex) {
            Alert.alert('Lỗi', 'Không tải được danh sách lịch hẹn!');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', loadAppointments);
        return unsubscribe;
    }, [navigation, loadAppointments]);

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const [y, m, d] = dateStr.split('-');
        return `${d}/${m}/${y}`;
    };

    return (
        
        <ScrollView style={{ flex: 1, backgroundColor: '#F5F7FA', padding: 16 }}>
            <Text style={{
                fontSize: 20, fontWeight: '700',
                color: '#1565C0', marginBottom: 16,
            }}>
                📋 Lịch hẹn của tôi
            </Text>

            {loading && (
                <ActivityIndicator size="large" color="#1565C0" style={{ marginTop: 40 }} />
            )}

            {!loading && appointments.length === 0 && (
                <View style={{ alignItems: 'center', marginTop: 60 }}>
                    <Text style={{ fontSize: 40 }}>📭</Text>
                    <Text style={{ color: 'gray', marginTop: 8 }}>
                        Bạn chưa có lịch hẹn nào
                    </Text>
                </View>
            )}

            {!loading && appointments.map(apt => (
                <TouchableOpacity
                    key={apt.id}
                    onPress={() => navigation.navigate('AppointmentDetail', { appointment: apt })}
                    activeOpacity={0.85}
                >
                    <Card style={{
                        marginBottom: 12,
                        borderRadius: 12,
                        elevation: 2,
                    }}>
                        <Card.Content>

                            <View style={{
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: 8,
                            }}>
                                <Text style={{ fontWeight: '700', fontSize: 15, flex: 1 }}>
                                    👨‍⚕️ {apt.doctor_name}
                                </Text>
                                <Chip
                                    style={{
                                        backgroundColor: STATUS_COLOR[apt.status] + '22',
                                    }}
                                    textStyle={{ color: STATUS_COLOR[apt.status], fontSize: 11 }}
                                >
                                    {STATUS_LABEL[apt.status] || apt.status}
                                </Chip>
                            </View>

                            <Text style={{ color: '#555', marginBottom: 2 }}>
                                📅 {formatDate(apt.work_date)}
                            </Text>
                            <Text style={{ color: '#555', marginBottom: 2 }}>
                                ⏰ {apt.appointment_time}
                            </Text>
                            <Text style={{ color: '#555' }}>
                                📝 {apt.reason}
                            </Text>

                            <Text style={{
                                color: '#1565C0', fontSize: 12,
                                marginTop: 8, textAlign: 'right',
                            }}>
                                Xem chi tiết →
                            </Text>

                        </Card.Content>
                    </Card>
                </TouchableOpacity>
            ))}

            <View style={{ height: 32 }} />
        </ScrollView>
    );
};

export default MyAppointmentsScreen;