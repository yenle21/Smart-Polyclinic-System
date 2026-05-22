import React, { useEffect, useState, useCallback } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Card, Text, Chip, Button, Divider, ActivityIndicator } from 'react-native-paper';
import { authApis } from '../../configs/Apis';
import { useFocusEffect } from '@react-navigation/native';
import COLORS from '../../styles/colors';

const STATUS_OPTIONS = {
    pending:   { label: 'Chờ duyệt',  color: '#F59E0B' },
    confirmed: { label: 'Đã duyệt',   color: '#10B981' },
    cancelled: { label: 'Đã hủy',     color: '#EF4444' },
    completed: { label: 'Hoàn thành', color: '#6B7280' },
    no_show:   { label: 'Vắng mặt',   color: '#8B5CF6' },
};

export default function AppointmentDetailScreen({ route, navigation }) {
    const { id } = route.params;
    const [appointment, setAppointment] = useState(null);
    const [loading,     setLoading]     = useState(true);
    const [approving,   setApproving]   = useState(false);

    const fetchAppointment = useCallback(async () => {
        try {
            setLoading(true);
            const api = await authApis();
            const res = await api.get(`/appointments/${id}/`);
            setAppointment(res.data);
        } catch (err) {
            console.error('fetchAppointment:', err.response?.data || err);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useFocusEffect(useCallback(() => { fetchAppointment(); }, [fetchAppointment]));

    const handleApprove = async () => {
        try {
            setApproving(true);
            const api = await authApis();
            await api.patch(`/appointments/${id}/approve/`, { status: 'confirmed' });
            fetchAppointment();
        } catch (err) {
            console.error('handleApprove:', err.response?.data || err);
        } finally {
            setApproving(false);
        }
    };

    const handleReject = async () => {
        try {
            setApproving(true);
            const api = await authApis();
            await api.patch(`/appointments/${id}/approve/`, {
                status: 'cancelled',
                cancel_reason: 'Từ chối bởi nhân viên',
            });
            fetchAppointment();
        } catch (err) {
            console.error('handleReject:', err.response?.data || err);
        } finally {
            setApproving(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    if (!appointment) {
        return (
            <View style={styles.center}>
                <Text>Không tìm thấy lịch hẹn</Text>
            </View>
        );
    }

    const s = STATUS_OPTIONS[appointment.status] || { label: appointment.status, color: '#888' };

    return (
        <ScrollView style={styles.container}>
            <Card style={styles.card}>
                <Card.Content>

                    {/* Header */}
                    <View style={styles.row}>
                        <Text variant="titleLarge" style={styles.title}>
                            Lịch hẹn #{appointment.id}
                        </Text>
                        <Chip
                            textStyle={{ color: s.color, fontSize: 11 }}
                            style={{ backgroundColor: s.color + '20' }}
                        >
                            {s.label}
                        </Chip>
                    </View>

                    <Divider style={styles.divider} />

                    {/* Thông tin bệnh nhân */}
                    <Text style={styles.sectionTitle}>👤 Bệnh nhân</Text>
                    <Row label="Họ tên"    value={appointment.patient_name || '---'} />

                    <Divider style={styles.divider} />

                    {/* Thông tin bác sĩ */}
                    <Text style={styles.sectionTitle}>🩺 Bác sĩ</Text>
                    <Row label="Họ tên"     value={appointment.doctor_name    || '---'} />
                    <Row label="Chuyên khoa" value={appointment.specialty_name || '---'} />

                    <Divider style={styles.divider} />

                    {/* Thông tin lịch hẹn */}
                    <Text style={styles.sectionTitle}>📅 Thông tin lịch hẹn</Text>
                    <Row label="Ngày khám"   value={appointment.work_date         || '---'} />
                    <Row label="Giờ khám"    value={appointment.appointment_time   || '---'} />
                    <Row label="Hình thức"   value={appointment.type === 'online' ? '💻 Khám online' : '🏥 Khám trực tiếp'} />
                    <Row label="Lý do khám"  value={appointment.reason            || '---'} />
                    {appointment.notes && (
                        <Row label="Ghi chú" value={appointment.notes} />
                    )}
                    {appointment.cancel_reason && (
                        <Row label="Lý do hủy" value={appointment.cancel_reason} />
                    )}

                    {/* Nút duyệt / từ chối */}
                    {appointment.status === 'pending' && (
                        <>
                            <Divider style={styles.divider} />
                            <Button
                                mode="contained"
                                loading={approving}
                                disabled={approving}
                                buttonColor="#10B981"
                                style={styles.btn}
                                onPress={handleApprove}
                            >
                                ✅ Duyệt lịch hẹn
                            </Button>
                            <Button
                                mode="outlined"
                                loading={approving}
                                disabled={approving}
                                textColor="#EF4444"
                                style={[styles.btn, { borderColor: '#EF4444', marginTop: 8 }]}
                                onPress={handleReject}
                            >
                                ❌ Từ chối
                            </Button>
                        </>
                    )}

                </Card.Content>
            </Card>
        </ScrollView>
    );
}

function Row({ label, value }) {
    return (
        <View style={styles.infoRow}>
            <Text style={styles.label}>{label}</Text>
            <Text style={styles.value}>{value}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container:    { flex: 1, backgroundColor: COLORS.background },
    card:         { margin: 12, borderRadius: 12 },
    center:       { flex: 1, justifyContent: 'center', alignItems: 'center' },
    row:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    title:        { fontWeight: 'bold', flex: 1 },
    divider:      { marginVertical: 12 },
    sectionTitle: { fontWeight: 'bold', color: COLORS.text, marginBottom: 8 },
    infoRow:      { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 4 },
    label:        { color: COLORS.gray, fontSize: 13 },
    value:        { color: COLORS.text, fontWeight: '500', fontSize: 13, flex: 1, textAlign: 'right' },
    btn:          { marginTop: 4, borderRadius: 8 },
});