import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    ActivityIndicator,
    TouchableOpacity,
    Alert,
} from 'react-native';
import {
    TextInput,
    Avatar,
    Button,
    Chip,
    Card,
} from 'react-native-paper';
import { authApis, endpoints } from '../../configs/Apis';
import styles from '../../styles/patientstyles';

const AppointmentCreateScreen = ({ navigation }) => {

    // =========================
    // STATES
    // =========================
    const [keyword, setKeyword]                   = useState('');
    const [specialty, setSpecialty]               = useState('');
    const [date, setDate]                         = useState('');

    const [schedules, setSchedules]               = useState([]);
    const [selectedSchedule, setSelectedSchedule] = useState(null);

    const [loading, setLoading]                   = useState(false);

    // =========================
    // FORMAT DATE
    // =========================

    // YYYY-MM-DD -> DD/MM/YYYY
    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const [year, month, day] = dateStr.split('-');
        return `${day}/${month}/${year}`;
    };

    // DD/MM/YYYY -> YYYY-MM-DD
    const parseDate = (dateStr) => {
        if (!dateStr) return '';
        const parts = dateStr.split('/');
        if (parts.length !== 3) return '';
        const [day, month, year] = parts;
        if (day.length !== 2 || month.length !== 2 || year.length !== 4) return '';
        const d = parseInt(day, 10);
        const m = parseInt(month, 10);
        const y = parseInt(year, 10);
        if (isNaN(d) || isNaN(m) || isNaN(y)) return '';
        if (m < 1 || m > 12) return '';
        if (d < 1 || d > 31) return '';
        return `${year}-${month}-${day}`;
    };

    // Auto format DD/MM/YYYY khi gõ
    const handleDateChange = (text) => {
        const digits = text.replace(/\D/g, '');
        let formatted = digits;
        if (digits.length >= 3 && digits.length <= 4) {
            formatted = `${digits.slice(0, 2)}/${digits.slice(2)}`;
        } else if (digits.length >= 5) {
            formatted = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
        }
        setDate(formatted);
    };

    // =========================
    // LOAD KHI MỞ SCREEN
    // =========================
    useEffect(() => {
        loadSchedules();
    }, []);

    // =========================
    // LOAD SCHEDULES
    // =========================
    const loadSchedules = async () => {
        try {
            setLoading(true);
            setSelectedSchedule(null);

            const params = new URLSearchParams();

            if (keyword.trim())
                params.append('doctor', keyword.trim());

            if (specialty.trim())
                params.append('specialty', specialty.trim());

            if (date.trim()) {
                const apiDate = parseDate(date.trim());
                if (apiDate) {
                    params.append('date', apiDate);
                } else {
                    Alert.alert('Lỗi', 'Ngày khám không đúng định dạng DD/MM/YYYY');
                    setLoading(false);
                    return;
                }
            }

            const query = params.toString();
            const url   = query
                ? `${endpoints['schedules']}?${query}`
                : endpoints['schedules'];

            const api = await authApis();
            const res = await api.get(url);

            const data = Array.isArray(res.data)
                ? res.data
                : (res.data.results ?? []);

            setSchedules(data);

        } catch (ex) {
            console.error('LOAD SCHEDULE ERROR:', ex);
            Alert.alert('Lỗi', 'Không tải được lịch khám!');
            setSchedules([]);
        } finally {
            setLoading(false);
        }
    };

    // =========================
    // RENDER
    // =========================
    return (
        <ScrollView
            style={styles.container}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
        >

            {/* HEADER */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>📅 Lịch khám</Text>
                <Text style={styles.headerSubtitle}>
                    Tìm và chọn lịch khám phù hợp với bạn
                </Text>
            </View>

            {/* SEARCH */}
            <Card style={styles.searchCard}>
                <Card.Content>

                    <TextInput
                        label="Tên bác sĩ"
                        value={keyword}
                        onChangeText={setKeyword}
                        mode="outlined"
                        style={styles.searchInput}
                        left={<TextInput.Icon icon="doctor" />}
                    />

                    <View style={styles.filterRow}>

                        <TextInput
                            label="Chuyên khoa"
                            value={specialty}
                            onChangeText={setSpecialty}
                            mode="outlined"
                            style={styles.filterInputLeft}
                            left={<TextInput.Icon icon="hospital-box" />}
                        />

                        <TextInput
                            label="Ngày khám"
                            value={date}
                            onChangeText={handleDateChange}
                            placeholder="DD/MM/YYYY"
                            keyboardType="default"
                            maxLength={10}
                            mode="outlined"
                            style={styles.filterInputRight}
                            left={<TextInput.Icon icon="calendar" />}
                        />

                    </View>

                    <Button
                        mode="contained"
                        icon="magnify"
                        style={styles.searchBtn}
                        labelStyle={styles.searchBtnText}
                        onPress={loadSchedules}
                    >
                        Tìm lịch khám
                    </Button>

                </Card.Content>
            </Card>

            {/* LOADING */}
            {loading && (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#1565C0" />
                    <Text style={styles.loadingText}>Đang tải lịch khám...</Text>
                </View>
            )}

            {/* EMPTY */}
            {!loading && schedules.length === 0 && (
                <View style={styles.emptyContainer}>
                    <Text style={{ fontSize: 40 }}>🔍</Text>
                    <Text style={styles.emptyText}>Không tìm thấy lịch khám</Text>
                </View>
            )}

            {/* COUNT */}
            {!loading && schedules.length > 0 && (
                <Text style={styles.resultHeader}>
                    {schedules.length} lịch khám
                </Text>
            )}

            {/* LIST */}
            {!loading && schedules.map(s => (
                <TouchableOpacity
                    key={s.id}
                    activeOpacity={0.9}
                    onPress={() =>
                        setSelectedSchedule(
                            selectedSchedule?.id === s.id ? null : s
                        )
                    }
                >
                    <Card style={[
                        styles.scheduleCard,
                        selectedSchedule?.id === s.id && styles.scheduleCardSelected,
                    ]}>
                        <Card.Content>

                            {/* TOP ROW */}
                            <View style={styles.topRow}>
                                <View style={styles.doctorRow}>
                                    <Avatar.Icon
                                        size={52}
                                        icon="doctor"
                                        style={styles.avatar}
                                    />
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.doctorName}>
                                            {s.doctor_name}
                                        </Text>
                                        <Text style={styles.specialty}>
                                            {s.specialty_name}
                                        </Text>
                                    </View>
                                </View>
                                <Chip style={styles.slotChip}>
                                    {s.available_slots} slot
                                </Chip>
                            </View>

                            {/* INFO CƠ BẢN — luôn hiện */}
                            <View style={styles.infoBox}>
                                <Text style={styles.infoText}>
                                    📅 {formatDate(s.work_date)}
                                </Text>
                                <Text style={styles.infoText}>
                                    ⏰ {s.start_time} - {s.end_time}
                                </Text>
                            </View>

                            {/* NÚT CHỌN */}
                            <Button
                                mode="outlined"
                                style={styles.selectBtn}
                                labelStyle={styles.selectBtnText}
                                onPress={() =>
                                    setSelectedSchedule(
                                        selectedSchedule?.id === s.id ? null : s
                                    )
                                }
                            >
                                {selectedSchedule?.id === s.id
                                    ? '▲ Ẩn chi tiết'
                                    : '▼ Xem chi tiết'}
                            </Button>

                            {/* CHI TIẾT — chỉ hiện khi được chọn */}
                            {selectedSchedule?.id === s.id && (
                                <View style={{
                                    marginTop: 12,
                                    backgroundColor: '#E3F2FD',
                                    borderRadius: 8,
                                    padding: 12,
                                }}>

                                    <Text style={{
                                        fontWeight: '700',
                                        fontSize: 14,
                                        color: '#1565C0',
                                        marginBottom: 8,
                                    }}>
                                        🗓️ Chi tiết lịch khám
                                    </Text>

                                    <Text style={styles.infoText}>
                                        👨‍⚕️ Bác sĩ: {s.doctor_name}
                                    </Text>
                                    <Text style={styles.infoText}>
                                        🏥 Chuyên khoa: {s.specialty_name}
                                    </Text>
                                    <Text style={styles.infoText}>
                                        📅 Ngày khám: {formatDate(s.work_date)}
                                    </Text>
                                    <Text style={styles.infoText}>
                                        ⏰ Giờ bắt đầu: {s.start_time}
                                    </Text>
                                    <Text style={styles.infoText}>
                                        ⏰ Giờ kết thúc: {s.end_time}
                                    </Text>
                                    <Text style={styles.infoText}>
                                        🪑 Slot còn lại: {s.available_slots}
                                    </Text>

                                    {/* NÚT ĐẶT LỊCH → chuyển sang BookingScreen */}
                                    <Button
                                        mode="contained"
                                        icon="calendar-check"
                                        style={[styles.bookBtn, { marginTop: 12 }]}
                                        labelStyle={styles.bookBtnText}
                                        onPress={() =>
                                            navigation.navigate(
                                                'AppointmentBooking',
                                                { schedule: s }
                                            )
                                        }
                                    >
                                        Đặt lịch này
                                    </Button>

                                </View>
                            )}

                        </Card.Content>
                    </Card>
                </TouchableOpacity>
            ))}

            <View style={{ height: 32 }} />

        </ScrollView>
    );
};

export default AppointmentCreateScreen;