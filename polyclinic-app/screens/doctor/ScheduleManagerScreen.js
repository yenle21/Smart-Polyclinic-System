import React, { useEffect, useState, useCallback, useContext } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    Modal, TextInput, Alert, ActivityIndicator, RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { authApis, endpoints } from '../../configs/Apis';
import { MyUserContext } from '../../configs/Contexts';

// =========================
// HELPERS
// =========================
const DAYS_VI = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

const getWeekDates = () => {
    const today  = new Date();
    const day    = today.getDay(); // 0 = CN
    const monday = new Date(today);
    monday.setDate(today.getDate() - (day === 0 ? 6 : day - 1));

    return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        return d;
    });
};

const toDateStr = (date) => date.toISOString().split('T')[0]; // yyyy-mm-dd

// =========================
// SCREEN
// =========================
const ScheduleManagerScreen = () => {

    const [user]       = useContext(MyUserContext);
    const [schedules,  setSchedules]  = useState([]);
    const [loading,    setLoading]    = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [editTarget,   setEditTarget]   = useState(null); // null = tạo mới

    const weekDates = getWeekDates();

    // form state
    const [form, setForm] = useState({
        work_date:  '',
        start_time: '',
        end_time:   '',
        max_slots:  '10',
    });

    // =========================
    // LOAD
    // =========================
    const loadSchedules = async () => {
        try {
            const api = await authApis();
            const res = await api.get(endpoints['schedules']);
            const data = res.data;
            setSchedules(Array.isArray(data) ? data : (data.results || []));
        } catch (err) {
            console.log('LOAD SCHEDULES ERROR:', err.response?.data || err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => { loadSchedules(); }, []);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadSchedules();
    }, []);

    // =========================
    // OPEN MODAL
    // =========================
    const openCreate = (date) => {
        setEditTarget(null);
        setForm({ work_date: toDateStr(date), start_time: '', end_time: '', max_slots: '10' });
        setModalVisible(true);
    };

    const openEdit = (schedule) => {
        setEditTarget(schedule);
        setForm({
            work_date:  schedule.work_date,
            start_time: schedule.start_time,
            end_time:   schedule.end_time,
            max_slots:  String(schedule.max_slots),
        });
        setModalVisible(true);
    };

    // =========================
    // SAVE (tạo hoặc sửa)
    // =========================
    const handleSave = async () => {
        if (!form.start_time || !form.end_time) {
            Alert.alert('Lỗi', 'Vui lòng nhập giờ bắt đầu và kết thúc');
            return;
        }

        try {
            const api = await authApis();

            if (editTarget) {
                await api.patch(
                    endpoints['schedules-detail'](editTarget.id),
                    { ...form, max_slots: Number(form.max_slots) }
                );
                Alert.alert('Thành công', 'Đã cập nhật lịch');
            } else {
                await api.post(
                    endpoints['schedules'],
                    { ...form, max_slots: Number(form.max_slots) }
                );
                Alert.alert('Thành công', 'Đã tạo lịch mới');
            }

            setModalVisible(false);
            loadSchedules();

        } catch (err) {
            console.log('SAVE ERROR:', err.response?.data || err);
            Alert.alert('Lỗi', JSON.stringify(err.response?.data || 'Không thể lưu'));
        }
    };

    // =========================
    // DELETE
    // =========================
    const handleDelete = (id) => {
    Alert.alert('Xác nhận', 'Xoá lịch làm việc này?', [
        { text: 'Huỷ', style: 'cancel' },
        {
            text: 'Xoá', style: 'destructive',
            onPress: async () => {
                try {
                    const api = await authApis();
                    await api.delete(endpoints['schedules-detail'](id));
                    loadSchedules();
                } catch (err) {
                    console.log('DELETE ERROR status:', err.response?.status);
                    console.log('DELETE ERROR data:', JSON.stringify(err.response?.data));
                    console.log('DELETE ERROR url:', err.config?.url);
                    Alert.alert('Lỗi', JSON.stringify(err.response?.data || 'Không thể xoá'));
                }
            },
        },
    ]);
};

    // =========================
    // RENDER NGÀY
    // =========================
    const renderDay = (date, idx) => {
        const dateStr     = toDateStr(date);
        const daySchedules = schedules.filter(s => s.work_date === dateStr);
        const isToday     = dateStr === toDateStr(new Date());

        return (
            <View key={idx} style={styles.dayBlock}>

                {/* HEADER NGÀY */}
                <View style={[styles.dayHeader, isToday && styles.dayHeaderToday]}>
                    <Text style={[styles.dayLabel, isToday && styles.dayLabelToday]}>
                        {DAYS_VI[date.getDay()]}
                    </Text>
                    <Text style={[styles.dateNum, isToday && styles.dateNumToday]}>
                        {date.getDate()}/{date.getMonth() + 1}
                    </Text>
                </View>

                {/* SLOTS */}
                {daySchedules.length === 0 ? (
                    <Text style={styles.emptyDay}>Trống</Text>
                ) : (
                    daySchedules.map(s => (
                        <View key={s.id} style={styles.slotCard}>
                            <Text style={styles.slotTime}>
                                {s.start_time.slice(0, 5)} – {s.end_time.slice(0, 5)}
                            </Text>
                            <Text style={styles.slotSlots}>
                                🪑 {s.available_slots}/{s.max_slots}
                            </Text>
                            <View style={styles.slotActions}>
                                <TouchableOpacity onPress={() => openEdit(s)}>
                                    <MaterialCommunityIcons name="pencil" size={16} color="#2196F3" />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => handleDelete(s.id)} style={{ marginLeft: 10 }}>
                                    <MaterialCommunityIcons name="trash-can" size={16} color="#EF4444" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))
                )}

                {/* NÚT THÊM */}
                <TouchableOpacity style={styles.addBtn} onPress={() => openCreate(date)}>
                    <MaterialCommunityIcons name="plus" size={18} color="#2196F3" />
                </TouchableOpacity>

            </View>
        );
    };

    // =========================
    // LOADING
    // =========================
    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" />
                <Text>Đang tải lịch làm việc...</Text>
            </View>
        );
    }

    // =========================
    // MAIN
    // =========================
    return (
        <View style={styles.container}>

            <Text style={styles.weekTitle}>
                Tuần {toDateStr(weekDates[0])} — {toDateStr(weekDates[6])}
            </Text>

            <ScrollView
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {weekDates.map((d, i) => renderDay(d, i))}
            </ScrollView>

            {/* ===== MODAL TẠO / SỬA ===== */}
            <Modal visible={modalVisible} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalBox}>

                        <Text style={styles.modalTitle}>
                            {editTarget ? 'Cập nhật lịch' : 'Thêm lịch mới'}
                        </Text>

                        <Text style={styles.inputLabel}>Ngày làm việc</Text>
                        <TextInput
                            style={styles.input}
                            value={form.work_date}
                            onChangeText={v => setForm({ ...form, work_date: v })}
                            placeholder="yyyy-mm-dd"
                        />

                        <Text style={styles.inputLabel}>Giờ bắt đầu</Text>
                        <TextInput
                            style={styles.input}
                            value={form.start_time}
                            onChangeText={v => setForm({ ...form, start_time: v })}
                            placeholder="HH:MM"
                        />

                        <Text style={styles.inputLabel}>Giờ kết thúc</Text>
                        <TextInput
                            style={styles.input}
                            value={form.end_time}
                            onChangeText={v => setForm({ ...form, end_time: v })}
                            placeholder="HH:MM"
                        />

                        <Text style={styles.inputLabel}>Số slot tối đa</Text>
                        <TextInput
                            style={styles.input}
                            value={form.max_slots}
                            onChangeText={v => setForm({ ...form, max_slots: v })}
                            keyboardType="numeric"
                            placeholder="10"
                        />

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={[styles.modalBtn, styles.btnCancel]}
                                onPress={() => setModalVisible(false)}
                            >
                                <Text style={{ color: '#555' }}>Huỷ</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.modalBtn, styles.btnSave]}
                                onPress={handleSave}
                            >
                                <Text style={{ color: '#fff', fontWeight: '700' }}>Lưu</Text>
                            </TouchableOpacity>
                        </View>

                    </View>
                </View>
            </Modal>

        </View>
    );
};

export default ScheduleManagerScreen;

const styles = StyleSheet.create({

    container: {
        flex: 1,
        backgroundColor: '#F5F6FA',
        padding: 12,
    },

    weekTitle: {
        fontSize: 13,
        color: '#888',
        marginBottom: 12,
        textAlign: 'center',
    },

    // ===== NGÀY =====
    dayBlock: {
        backgroundColor: '#fff',
        borderRadius: 14,
        padding: 12,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
    },

    dayHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },

    dayHeaderToday: {
        backgroundColor: '#EFF6FF',
        borderRadius: 8,
        padding: 4,
    },

    dayLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: '#555',
    },

    dayLabelToday: { color: '#2196F3' },

    dateNum: {
        fontSize: 13,
        color: '#888',
    },

    dateNumToday: { color: '#2196F3', fontWeight: '700' },

    emptyDay: {
        fontSize: 12,
        color: '#bbb',
        marginBottom: 6,
    },

    // ===== SLOT =====
    slotCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0F7FF',
        borderRadius: 8,
        padding: 8,
        marginBottom: 6,
        gap: 8,
    },

    slotTime: {
        flex: 1,
        fontSize: 13,
        fontWeight: '600',
        color: '#1D4ED8',
    },

    slotSlots: {
        fontSize: 12,
        color: '#555',
    },

    slotActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    addBtn: {
        alignSelf: 'flex-start',
        marginTop: 4,
        padding: 4,
    },

    // ===== MODAL =====
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'flex-end',
    },

    modalBox: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 24,
    },

    modalTitle: {
        fontSize: 17,
        fontWeight: '700',
        marginBottom: 16,
        color: '#111',
    },

    inputLabel: {
        fontSize: 13,
        color: '#666',
        marginBottom: 4,
    },

    input: {
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 10,
        padding: 10,
        fontSize: 14,
        marginBottom: 12,
        color: '#111',
    },

    modalActions: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 4,
    },

    modalBtn: {
        flex: 1,
        padding: 13,
        borderRadius: 10,
        alignItems: 'center',
    },

    btnCancel: {
        backgroundColor: '#F3F4F6',
    },

    btnSave: {
        backgroundColor: '#2196F3',
    },

    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});