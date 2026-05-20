import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    Alert,
} from 'react-native';
import {
    TextInput,
    Button,
    Card,
    RadioButton,
} from 'react-native-paper';

import { authApis, endpoints } from '../../configs/Apis';
import styles from '../../styles/patientstyles';

const AppointmentBookingScreen = ({ navigation, route }) => {

    const { schedule } = route.params;

    // =========================
    // PROFILE STATE
    // =========================
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [gender, setGender] = useState('male');
    const [dob, setDob] = useState('');
    const [address, setAddress] = useState('');

    // =========================
    // APPOINTMENT STATE
    // =========================
    const [appointmentType, setAppointmentType] = useState('offline');
    const [reason, setReason] = useState('');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);

    // =========================
    // LOAD PROFILE
    // =========================
    const loadProfile = async () => {
        try {
            const api = await authApis();
            const res = await api.get(endpoints['patient-profile']);

            const data = res.data;

            setFullName(data.full_name || '');
            setPhone(data.phone || '');
            setGender(data.gender || 'male');
            setAddress(data.address || '');

            // Convert yyyy-mm-dd → dd/mm/yyyy để hiển thị
            const apiDob = data.dob || '';
            if (apiDob) {
                const [y, m, d] = apiDob.split('-');
                setDob(`${d}/${m}/${y}`);
            } else {
                setDob('');
            }

        } catch (ex) {
            console.error('LOAD PROFILE ERROR:', ex.response?.data);
        }
    };

    useEffect(() => {
        loadProfile();
    }, []);

    // =========================
    // FORMAT DATE (for schedule display)
    // =========================
    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const [y, m, d] = dateStr.split('-');
        return `${d}/${m}/${y}`;
    };

    // =========================
    // FORMAT DOB INPUT (auto format dd/mm/yyyy)
    // =========================
    const handleDobChange = (text) => {
        // Xóa hết ký tự không phải số
        const digits = text.replace(/\D/g, '');

        let formatted = digits;
        if (digits.length >= 3 && digits.length <= 4) {
            formatted = `${digits.slice(0, 2)}/${digits.slice(2)}`;
        } else if (digits.length >= 5) {
            formatted = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
        }

        setDob(formatted);
    };

    // =========================
    // CONVERT DOB dd/mm/yyyy → yyyy-mm-dd (for API)
    // =========================
    const convertDobForApi = (dobStr) => {
        if (!dobStr || dobStr.length < 10) return dobStr;
        const [d, m, y] = dobStr.split('/');
        return `${y}-${m}-${d}`;
    };

    // =========================
    // VALIDATE
    // =========================
    const validate = () => {
        if (!fullName.trim()) return 'Vui lòng nhập họ tên!';
        if (!phone.trim()) return 'Vui lòng nhập số điện thoại!';
        if (!reason.trim()) return 'Vui lòng nhập lý do khám!';
        return null;
    };

    // =========================
    // BOOK APPOINTMENT
    // =========================
    const bookAppointment = async () => {

        if (loading) return;

        const error = validate();
        if (error) {
            Alert.alert('Thiếu thông tin', error);
            return;
        }

        try {
            setLoading(true);

            const api = await authApis();

            // =========================
            // PROFILE (FORM DATA)
            // =========================
            const profileForm = new FormData();
            profileForm.append('full_name', fullName.trim());
            profileForm.append('phone', phone.trim());
            profileForm.append('gender', gender);
            profileForm.append('dob', convertDobForApi(dob));
            profileForm.append('address', address.trim());

            await api.patch(endpoints['patient-profile'], profileForm, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                }
            });

            // =========================
            // BOOK APPOINTMENT (FORM DATA)
            // =========================
            const bookingForm = new FormData();
            bookingForm.append('schedule', schedule.id);
            bookingForm.append('appointment_time', schedule.start_time);
            bookingForm.append('type', appointmentType);
            bookingForm.append('reason', reason.trim());
            bookingForm.append('notes', notes.trim());

            await api.post(endpoints['appointment-book'], bookingForm, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                }
            });

            Alert.alert(
                'Thành công',
                'Đặt lịch khám thành công!',
            );

        } catch (ex) {

        

            const msg =
                ex.response?.data?.non_field_errors?.[0] ||
                ex.response?.data?.detail ||
                'Đặt lịch thất bại!';

            Alert.alert('Thông báo', msg);

        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container}>

            {/* HEADER */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>📋 Đặt lịch khám</Text>
                <Text style={styles.headerSubtitle}>
                    Xác nhận thông tin bệnh nhân
                </Text>
            </View>

            {/* SCHEDULE */}
            <Card style={styles.confirmCard}>
                <Card.Content>
                    <Text style={{ fontWeight: '700' }}>🗓️ Lịch khám</Text>
                    <Text>👨‍⚕️ {schedule.doctor_name}</Text>
                    <Text>📅 {formatDate(schedule.work_date)}</Text>
                    <Text>⏰ {schedule.start_time} - {schedule.end_time}</Text>
                </Card.Content>
            </Card>

            {/* PATIENT INFO */}
            <Card style={{ marginTop: 12 }}>
                <Card.Content>

                    <Text style={{ fontWeight: '700', marginBottom: 10 }}>
                        👤 Thông tin bệnh nhân
                    </Text>

                    <TextInput
                        label="Họ tên *"
                        value={fullName}
                        onChangeText={setFullName}
                        mode="outlined"
                        style={{ marginBottom: 10 }}
                    />

                    <TextInput
                        label="Số điện thoại *"
                        value={phone}
                        onChangeText={setPhone}
                        keyboardType="phone-pad"
                        mode="outlined"
                        style={{ marginBottom: 10 }}
                    />

                    <TextInput
                        label="Ngày sinh (dd/mm/yyyy)"
                        value={dob}
                        onChangeText={handleDobChange}
                        keyboardType="numeric"
                        placeholder="dd/mm/yyyy"
                        maxLength={10}
                        mode="outlined"
                        style={{ marginBottom: 10 }}
                    />

                    <TextInput
                        label="Địa chỉ"
                        value={address}
                        onChangeText={setAddress}
                        mode="outlined"
                        style={{ marginBottom: 10 }}
                    />

                    {/* GENDER */}
                    <Text style={{ marginBottom: 6, fontWeight: '600' }}>
                        Giới tính:
                    </Text>

                    <RadioButton.Group value={gender} onValueChange={setGender}>
                        <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            marginBottom: 10,
                        }}>

                            <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 24 }}>
                                <RadioButton value="male" />
                                <Text>Nam</Text>
                            </View>

                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <RadioButton value="female" />
                                <Text>Nữ</Text>
                            </View>

                        </View>
                    </RadioButton.Group>

                </Card.Content>
            </Card>

            {/* APPOINTMENT INFO */}
            <Card style={{ marginTop: 12 }}>
                <Card.Content>

                    <Text style={{ fontWeight: '700', marginBottom: 10 }}>
                        🏥 Hình thức khám
                    </Text>

                    <RadioButton.Group
                        value={appointmentType}
                        onValueChange={setAppointmentType}
                    >
                        <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            marginBottom: 12,
                        }}>

                            <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 20 }}>
                                <RadioButton value="offline" />
                                <Text>Trực tiếp</Text>
                            </View>

                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <RadioButton value="online" />
                                <Text>Online</Text>
                            </View>

                        </View>
                    </RadioButton.Group>

                    <TextInput
                        label="Lý do khám *"
                        value={reason}
                        onChangeText={setReason}
                        mode="outlined"
                        multiline
                        numberOfLines={3}
                        style={{ marginBottom: 10 }}
                    />

                    <TextInput
                        label="Ghi chú"
                        value={notes}
                        onChangeText={setNotes}
                        mode="outlined"
                        multiline
                        numberOfLines={3}
                    />

                </Card.Content>
            </Card>

            {/* BUTTONS */}
            <View style={{ padding: 16, gap: 10 }}>

                <Button
                    mode="contained"
                    loading={loading}
                    disabled={loading}
                    onPress={bookAppointment}
                >
                    Xác nhận đặt lịch
                </Button>

                <Button
                    mode="outlined"
                    onPress={() => navigation.goBack()}
                >
                    Quay lại
                </Button>

            </View>

        </ScrollView>
    );
};

export default AppointmentBookingScreen;