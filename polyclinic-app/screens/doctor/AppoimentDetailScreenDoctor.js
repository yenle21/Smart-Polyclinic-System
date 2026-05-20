import React from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { Card, Button, Divider } from 'react-native-paper';
import { authApis, endpoints } from '../../configs/Apis';

const AppointmentDetailScreenDoctor = ({ route, navigation }) => {

    const { appointment } = route.params;

    // =========================
    // CONFIRM APPOINTMENT
    // =========================
    const handleConfirm = async () => {
        try {
            const api = await authApis();

            await api.patch(
                endpoints['appointment-detail'](appointment.id),
                { status: 'confirmed' }
            );

            Alert.alert('Thành công', 'Đã xác nhận lịch khám');

            navigation.goBack();

        } catch (err) {
            console.log(err.response?.data || err);
            Alert.alert('Lỗi', 'Không thể xác nhận');
        }
    };

    // =========================
    // CANCEL APPOINTMENT
    // =========================
    const handleCancel = async () => {
        try {
            const api = await authApis();

            await api.patch(
                endpoints['appointment-detail'](appointment.id),
                { status: 'cancelled' }
            );

            Alert.alert('Thành công', 'Đã huỷ lịch khám');

            navigation.goBack();

        } catch (err) {
            console.log(err.response?.data || err);
            Alert.alert('Lỗi', 'Không thể huỷ');
        }
    };

    const statusColor =
        appointment.status === 'confirmed'
            ? '#22C55E'
            : appointment.status === 'cancelled'
                ? '#EF4444'
                : '#F59E0B';

    const statusLabel =
        appointment.status === 'confirmed'
            ? 'Đã xác nhận'
            : appointment.status === 'cancelled'
                ? 'Đã huỷ'
                : 'Chờ xác nhận';

    return (
        <ScrollView style={styles.container}>

            {/* ================= HEADER ================= */}
            <Card style={styles.card}>
                <Card.Title title="Chi tiết lịch khám" />
                <Card.Content>

                    <Text style={styles.label}>Bệnh nhân</Text>
                    <Text style={styles.value}>{appointment.patient_name}</Text>

                    <Divider style={styles.divider} />

                    <Text style={styles.label}>Bác sĩ</Text>
                    <Text style={styles.value}>{appointment.doctor_name}</Text>

                    <Divider style={styles.divider} />

                    <Text style={styles.label}>Chuyên khoa</Text>
                    <Text style={styles.value}>{appointment.specialty_name}</Text>

                    <Divider style={styles.divider} />

                    <Text style={styles.label}>Ngày khám</Text>
                    <Text style={styles.value}>{appointment.work_date}</Text>

                    <Divider style={styles.divider} />

                    <Text style={styles.label}>Giờ khám</Text>
                    <Text style={styles.value}>{appointment.appointment_time}</Text>

                    <Divider style={styles.divider} />

                    <Text style={styles.label}>Hình thức</Text>
                    <Text style={styles.value}>
                        {appointment.type === 'online'
                            ? 'Khám online'
                            : 'Khám tại phòng khám'}
                    </Text>

                    <Divider style={styles.divider} />

                    <Text style={styles.label}>Trạng thái</Text>
                    <Text style={[styles.value, { color: statusColor, fontWeight: '700' }]}>
                        {statusLabel}
                    </Text>

                </Card.Content>
            </Card>

            {/* ================= ACTION ================= */}
            <View style={styles.actions}>

                {appointment.status === 'pending' && (
                    <>
                        <Button
                            mode="contained"
                            onPress={handleConfirm}
                            style={{ marginBottom: 10 }}
                        >
                            Xác nhận lịch
                        </Button>

                        <Button
                            mode="outlined"
                            textColor="red"
                            onPress={handleCancel}
                        >
                            Huỷ lịch
                        </Button>
                    </>
                )}

                {appointment.status === 'confirmed' && (
                    <Button mode="outlined" disabled>
                        Đã xác nhận
                    </Button>
                )}

                {appointment.status === 'cancelled' && (
                    <Button mode="outlined" textColor="red" disabled>
                        Đã huỷ
                    </Button>
                )}

            </View>

        </ScrollView>
    );
};

export default AppointmentDetailScreenDoctor;

const styles = StyleSheet.create({

    container: {
        flex: 1,
        backgroundColor: '#F5F6FA',
        padding: 12,
    },

    card: {
        borderRadius: 16,
    },

    label: {
        fontSize: 13,
        color: '#666',
        marginTop: 8,
    },

    value: {
        fontSize: 15,
        color: '#111',
        marginTop: 2,
    },

    divider: {
        marginVertical: 6,
    },

    actions: {
        marginTop: 15,
    },
});