import React, { useState } from 'react';
import {
    View, Text, ScrollView, Alert,
} from 'react-native';
import { Card, Button, Chip } from 'react-native-paper';
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

const AppointmentDetailScreen = ({ navigation, route }) => {
    const { appointment: initial } = route.params;
    const [appointment, setAppointment] = useState(initial);
    const [loading, setLoading] = useState(false);

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const [y, m, d] = dateStr.split('-');
        return `${d}/${m}/${y}`;
    };

    const handleCancel = () => {
        Alert.alert(
            'Xác nhận hủy',
            'Bạn có chắc muốn hủy lịch hẹn này không?',
            [
                { text: 'Không', style: 'cancel' },
                { text: 'Hủy lịch', style: 'destructive', onPress: confirmCancel },
            ]
        );
    };

    const confirmCancel = async () => {
        try {
            setLoading(true);
            const api = await authApis();
            await api.patch(endpoints['appointment-cancel'](appointment.id));
            setAppointment(prev => ({ ...prev, status: 'cancelled' }));
            Alert.alert('Thành công', 'Đã hủy lịch hẹn!');
        } catch (ex) {
            const msg = ex.response?.data?.detail || 'Hủy lịch thất bại!';
            Alert.alert('Lỗi', msg);
        } finally {
            setLoading(false);
        }
    };

    const canCancel = appointment.status === 'pending';

    return (
        <ScrollView style={{ flex: 1, backgroundColor: '#F5F7FA', padding: 16 }}>

            {/* TRẠNG THÁI */}
            <View style={{ alignItems: 'center', marginBottom: 16 }}>
                <Chip
                    style={{
                        backgroundColor: STATUS_COLOR[appointment.status] + '22',
                        paddingHorizontal: 12,
                    }}
                    textStyle={{
                        color: STATUS_COLOR[appointment.status],
                        fontSize: 14,
                        fontWeight: '700',
                    }}
                >
                    {STATUS_LABEL[appointment.status] || appointment.status}
                </Chip>
            </View>

            {/* CHI TIẾT */}
            <Card style={{ borderRadius: 12, marginBottom: 12 }}>
                <Card.Content>
                    <Text style={{ fontWeight: '700', fontSize: 16, marginBottom: 12, color: '#1565C0' }}>
                        🗓️ Chi tiết lịch hẹn
                    </Text>

                    <Row label="👨‍⚕️ Bác sĩ"       value={appointment.doctor_name} />
                    <Row label="🏥 Chuyên khoa"   value={appointment.specialty_name} />
                    <Row label="📅 Ngày khám"     value={formatDate(appointment.work_date)} />
                    <Row label="⏰ Giờ hẹn"       value={appointment.appointment_time} />
                    <Row label="🏷️ Hình thức"     value={appointment.type === 'online' ? 'Online' : 'Trực tiếp'} />
                    <Row label="📝 Lý do khám"    value={appointment.reason} />
                    {appointment.notes ? (
                        <Row label="💬 Ghi chú"   value={appointment.notes} />
                    ) : null}
                </Card.Content>
            </Card>

            {/* NÚT HỦY — chỉ hiện khi status = pending */}
            {canCancel && (
                <Button
                    mode="contained"
                    buttonColor="#F44336"
                    loading={loading}
                    disabled={loading}
                    icon="calendar-remove"
                    style={{ borderRadius: 8, marginBottom: 10 }}
                    onPress={handleCancel}
                >
                    Hủy lịch hẹn
                </Button>
            )}

            <Button
                mode="outlined"
                style={{ borderRadius: 8 }}
                onPress={() => navigation.goBack()}
            >
                Quay lại
            </Button>

            <View style={{ height: 32 }} />
        </ScrollView>
    );
};

// Component phụ cho từng dòng info
const Row = ({ label, value }) => (
    <View style={{ marginBottom: 10 }}>
        <Text style={{ color: 'gray', fontSize: 12 }}>{label}</Text>
        <Text style={{ fontSize: 15, fontWeight: '500', color: '#222' }}>
            {value || '---'}
        </Text>
    </View>
);

export default AppointmentDetailScreen;