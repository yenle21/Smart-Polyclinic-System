import React, { useState } from 'react';
import {
    View, Text, ScrollView, Alert, Modal, TouchableOpacity,
} from 'react-native';
import { Card, Button, Chip, TextInput, HelperText } from 'react-native-paper';
import { authApis, endpoints } from '../../configs/Apis';

const STATUS_COLOR = {
    pending:   '#FF9800',
    confirmed: '#4CAF50',
    cancelled: '#F44336',
    completed: '#2196F3',
    no_show:   '#9E9E9E',
};

const STATUS_LABEL = {
    pending:   'Chờ duyệt',
    confirmed: 'Đã duyệt',
    cancelled: 'Đã hủy',
    completed: 'Hoàn thành',
    no_show:   'Vắng mặt',
};

const AppointmentDetailScreen = ({ navigation, route }) => {
    const { appointment: initial } = route.params;
    const [appointment, setAppointment] = useState(initial);
    const [loading, setLoading]         = useState(false);

    // =========================
    // STATE CHO DIALOG NHẬP GIỜ
    // =========================
    const [showTimeDialog, setShowTimeDialog] = useState(false);
    const [newSchedule, setNewSchedule]       = useState(null);
    const [newTime, setNewTime]               = useState('');
    const [timeError, setTimeError]           = useState('');

    // =========================
    // STATE CHO DIALOG HỦY LỊCH
    // =========================
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const [cancelReason, setCancelReason]         = useState('');
    const [cancelReasonError, setCancelReasonError] = useState('');

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const [y, m, d] = dateStr.split('-');
        return `${d}/${m}/${y}`;
    };

    // Lấy màu an toàn, tránh undefined
    const getStatusColor = (status) =>
        STATUS_COLOR[status] ?? '#9E9E9E';

    // =========================
    // VALIDATE + AUTO FORMAT GIỜ
    // =========================
    const handleTimeChange = (text) => {
        const digits = text.replace(/\D/g, '');
        let formatted = digits;
        if (digits.length >= 3) {
            formatted = `${digits.slice(0, 2)}:${digits.slice(2, 4)}`;
        }
        setNewTime(formatted);

        const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
        if (!timeRegex.test(formatted)) {
            setTimeError('Định dạng HH:MM (vd: 09:30)');
            return;
        }

        if (newSchedule) {
            const [sh, sm] = newSchedule.start_time.split(':').map(Number);
            const [eh, em] = newSchedule.end_time.split(':').map(Number);
            const [ih, im] = formatted.split(':').map(Number);
            const start = sh * 60 + sm;
            const end   = eh * 60 + em;
            const input = ih * 60 + im;

            if (input < start || input > end) {
                setTimeError(`Phải trong khoảng ${newSchedule.start_time} - ${newSchedule.end_time}`);
                return;
            }
        }

        setTimeError('');
    };

    // =========================
    // HỦY LỊCH — mở dialog nhập lý do
    // =========================
    const handleCancel = () => {
        setCancelReason('');
        setCancelReasonError('');
        setShowCancelDialog(true);
    };

    const confirmCancel = async () => {

        if (!cancelReason.trim()) {
            setCancelReasonError('Vui lòng nhập lý do hủy lịch!');
            return;
        }

        if (cancelReason.trim().length < 10) {
            setCancelReasonError('Lý do phải có ít nhất 10 ký tự!');
            return;
        }

        try {
            setLoading(true);
            setShowCancelDialog(false);
            const api = await authApis();
            await api.patch(
                endpoints['appointment-cancel'](appointment.id),
                { cancel_reason: cancelReason.trim() }
            );
            setAppointment(prev => ({
                ...prev,
                status: 'cancelled',
                cancel_reason: cancelReason.trim(),
            }));
            Alert.alert('Thành công', 'Đã hủy lịch hẹn!');
        } catch (ex) {
            const msg = ex.response?.data?.detail || 'Hủy lịch thất bại!';
            Alert.alert('Lỗi', msg);
        } finally {
            setLoading(false);
        }
    };

    // =========================
    // ĐỔI LỊCH
    // =========================
    const handleChangeSchedule = () => {
        navigation.navigate('ScheduleScreen', {
            selectMode: true,
            onScheduleSelected: (selected) => {
                setNewSchedule(selected);
                setNewTime('');
                setTimeError('');
                setShowTimeDialog(true);
            },
        });
    };

    const confirmChangeSchedule = async () => {
        if (!newTime.trim()) {
            setTimeError('Vui lòng nhập giờ khám!');
            return;
        }
        if (timeError) return;

        try {
            setLoading(true);
            setShowTimeDialog(false);
            const api = await authApis();
            const res = await api.patch(
                endpoints['appointment-change-schedule'](appointment.id),
                {
                    new_schedule_id:  newSchedule.id,
                    appointment_time: newTime,
                }
            );
            setAppointment(res.data);
            Alert.alert('Thành công', 'Đã đổi lịch hẹn!');
        } catch (ex) {
            const msg = ex.response?.data?.detail || 'Đổi lịch thất bại!';
            Alert.alert('Lỗi', msg);
        } finally {
            setLoading(false);
        }
    };

    const canCancel = appointment.status === 'pending';
    const canChange = appointment.status === 'pending' || appointment.status === 'confirmed';

    return (
        <>
            <ScrollView style={{ flex: 1, backgroundColor: '#F5F7FA', padding: 16 }}>

                {/* TRẠNG THÁI */}
                <View style={{ alignItems: 'center', marginBottom: 16 }}>
                    <Chip
                        style={{
                            backgroundColor: getStatusColor(appointment.status) + '22',
                            paddingHorizontal: 12,
                        }}
                        textStyle={{
                            color: getStatusColor(appointment.status),
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
                        <Row label="👨‍⚕️ Bác sĩ"      value={appointment.doctor_name} />
                        <Row label="🏥 Chuyên khoa"  value={appointment.specialty_name} />
                        <Row label="📅 Ngày khám"    value={formatDate(appointment.work_date)} />
                        <Row label="⏰ Giờ hẹn"      value={appointment.appointment_time} />
                        <Row label="🏷️ Hình thức"    value={appointment.type === 'online' ? 'Online' : 'Trực tiếp'} />
                        <Row label="📝 Lý do khám"   value={appointment.reason} />
                        {appointment.notes ? (
                            <Row label="💬 Ghi chú"  value={appointment.notes} />
                        ) : null}
                        {appointment.cancel_reason ? (
                            <Row label="❌ Lý do hủy" value={appointment.cancel_reason} />
                        ) : null}
                    </Card.Content>
                </Card>

                {/* NÚT ĐỔI LỊCH */}
                {canChange && (
                    <Button
                        mode="contained"
                        buttonColor="#1565C0"
                        loading={loading}
                        disabled={loading}
                        icon="calendar-edit"
                        style={{ borderRadius: 8, marginBottom: 10 }}
                        onPress={handleChangeSchedule}
                    >
                        Đổi lịch hẹn
                    </Button>
                )}

                {/* NÚT HỦY */}
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

            {/* DIALOG HỦY LỊCH — nhập lý do */}
            <Modal
                visible={showCancelDialog}
                transparent
                animationType="fade"
                onRequestClose={() => setShowCancelDialog(false)}
            >
                <TouchableOpacity
                    style={{ flex: 1, backgroundColor: '#00000066', justifyContent: 'center', padding: 24 }}
                    activeOpacity={1}
                    onPress={() => setShowCancelDialog(false)}
                >
                    <TouchableOpacity activeOpacity={1} onPress={() => {}}>
                        <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 20 }}>

                            <Text style={{ fontWeight: '700', fontSize: 16, color: '#F44336', marginBottom: 4 }}>
                                ❌ Hủy lịch hẹn
                            </Text>

                            <Text style={{ color: '#888', fontSize: 13, marginBottom: 14 }}>
                                Vui lòng cho biết lý do bạn muốn hủy lịch hẹn này.
                            </Text>

                            <TextInput
                                label="Lý do hủy lịch *"
                                value={cancelReason}
                                onChangeText={(text) => {
                                    setCancelReason(text);
                                    if (text.trim().length >= 10) {
                                        setCancelReasonError('');
                                    }
                                }}
                                multiline
                                numberOfLines={4}
                                mode="outlined"
                                error={!!cancelReasonError}
                                autoFocus
                                style={{ backgroundColor: '#fff' }}
                            />

                            <HelperText type="error" visible={!!cancelReasonError}>
                                {cancelReasonError}
                            </HelperText>

                            <Text style={{ color: '#aaa', fontSize: 12, marginBottom: 14 }}>
                                {cancelReason.trim().length}/10 ký tự tối thiểu
                            </Text>

                            <View style={{ flexDirection: 'row', gap: 10 }}>
                                <Button
                                    mode="outlined"
                                    style={{ flex: 1 }}
                                    onPress={() => setShowCancelDialog(false)}
                                >
                                    Đóng
                                </Button>
                                <Button
                                    mode="contained"
                                    buttonColor="#F44336"
                                    style={{ flex: 1 }}
                                    disabled={cancelReason.trim().length < 10}
                                    onPress={confirmCancel}
                                >
                                    Xác nhận hủy
                                </Button>
                            </View>

                        </View>
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>

            {/* DIALOG NHẬP GIỜ — hiện sau khi chọn lịch mới xong */}
            <Modal
                visible={showTimeDialog}
                transparent
                animationType="fade"
                onRequestClose={() => setShowTimeDialog(false)}
            >
                <TouchableOpacity
                    style={{ flex: 1, backgroundColor: '#00000066', justifyContent: 'center', padding: 24 }}
                    activeOpacity={1}
                    onPress={() => setShowTimeDialog(false)}
                >
                    <TouchableOpacity activeOpacity={1} onPress={() => {}}>
                        <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 20 }}>

                            <Text style={{ fontWeight: '700', fontSize: 16, color: '#1565C0', marginBottom: 4 }}>
                                ⏰ Chọn giờ khám mới
                            </Text>

                            {newSchedule && (
                                <Text style={{ color: '#888', fontSize: 13, marginBottom: 12 }}>
                                    Khung giờ: {newSchedule.start_time} - {newSchedule.end_time}
                                </Text>
                            )}

                            <TextInput
                                label="Giờ khám (HH:MM)"
                                value={newTime}
                                onChangeText={handleTimeChange}
                                keyboardType="numeric"
                                placeholder="vd: 09:30"
                                maxLength={5}
                                mode="outlined"
                                error={!!timeError}
                                autoFocus
                            />

                            <HelperText type="error" visible={!!timeError}>
                                {timeError}
                            </HelperText>

                            <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
                                <Button
                                    mode="outlined"
                                    style={{ flex: 1 }}
                                    onPress={() => setShowTimeDialog(false)}
                                >
                                    Hủy
                                </Button>
                                <Button
                                    mode="contained"
                                    style={{ flex: 1 }}
                                    disabled={!!timeError || !newTime}
                                    onPress={confirmChangeSchedule}
                                >
                                    Xác nhận
                                </Button>
                            </View>

                        </View>
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>
        </>
    );
};

const Row = ({ label, value }) => (
    <View style={{ marginBottom: 10 }}>
        <Text style={{ color: 'gray', fontSize: 12 }}>{label}</Text>
        <Text style={{ fontSize: 15, fontWeight: '500', color: '#222' }}>
            {value || '---'}
        </Text>
    </View>
);

export default AppointmentDetailScreen;