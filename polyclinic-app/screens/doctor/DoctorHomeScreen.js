import React, { useEffect, useState, useRef } from 'react';
import {
    View, Text, StyleSheet, ScrollView,
    FlatList, RefreshControl, Alert, ActivityIndicator as RNActivityIndicator,
} from 'react-native';
import { Card, Avatar, Chip, ActivityIndicator, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { authApis, endpoints } from '../../configs/Apis';
import { db } from '../../configs/firebase';
import { ref, set, update, onValue, off } from 'firebase/database';

const RING_TIMEOUT = 30000;
const MAX_ATTEMPTS = 2;

const DoctorHomeScreen = ({ navigation }) => {

    const [loading, setLoading]       = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [doctor, setDoctor]         = useState(null);
    const [overview, setOverview]     = useState({
        total_appointments: 0, pending: 0, confirmed: 0, completed: 0, cancelled: 0,
    });
    const [appointments, setAppointments] = useState([]);
    const [callingId, setCallingId]       = useState(null);
    const [attempt, setAttempt]           = useState(0);
    const [callStatus, setCallStatus]     = useState({});

    const timeoutRef  = useRef(null);
    const listenerRef = useRef(null);

    // ── Kiểm tra hôm nay ─────────────────────────────
    const isToday = (dateStr) => {
        const today = new Date();
        const date  = new Date(dateStr);
        return (
            date.getDate()     === today.getDate()     &&
            date.getMonth()    === today.getMonth()    &&
            date.getFullYear() === today.getFullYear()
        );
    };

    // ── Load dashboard ────────────────────────────────
    const loadData = async () => {
        try {
            const api = await authApis();
            const userRes = await api.get(endpoints['current-user']);
            setDoctor(userRes.data);

            // ✅ Dùng API appointments sẵn có
            const res  = await api.get(endpoints['appointments']);
            const data = res.data;
            const list = Array.isArray(data) ? data : (data.results || []);

            // ✅ Lọc lịch hôm nay
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const filteredList = list.filter(item => {
                return isToday(item.work_date) && item.status !== 'cancelled'
            });
            const todayList = list.filter(item => isToday(item.work_date));

            setAppointments(filteredList);

            // ✅ Tính overview từ list hôm nay
            const allToday = list.filter(item => isToday(item.work_date));
            setOverview({
                total_appointments: allToday.length,
                confirmed: allToday.filter(a => a.status === 'confirmed').length,
                completed: allToday.filter(a => a.status === 'completed').length,
                no_show:   allToday.filter(a => a.status === 'no_show').length,
            });


        } catch (err) {
            console.log('LOAD ERROR:', err.response?.data || err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };
    useEffect(() => { loadData(); }, []);

    const onRefresh = () => { setRefreshing(true); loadData(); };

    // ── Cleanup ───────────────────────────────────────
    useEffect(() => {
        return () => {
            clearTimeout(timeoutRef.current);
            if (listenerRef.current) {
                off(listenerRef.current.ref, 'value', listenerRef.current.handler);
            }
        };
    }, []);


    // ── Đánh no_show ─────────────────────────────────
    const markNoShow = async (appointmentId) => {
        try {
            const api = await authApis();
            await api.patch(`/appointments/${appointmentId}/no-show/`);
        } catch (e) {
            console.error('markNoShow error:', e.response?.data || e);
        }
    };

    // ── Bắt đầu gọi ──────────────────────────────────
    const startCall = async (appointment, attemptNumber) => {
        setCallingId(appointment.id);
        setAttempt(attemptNumber);
        setCallStatus(prev => ({ ...prev, [appointment.id]: 'calling' }));

        const callRef = ref(db, `calls/${appointment.id}`);

        await set(callRef, {
            status:        'calling',
            attempt:       attemptNumber,
            startedAt:     Date.now(),
            appointmentId: appointment.id,
            patientName:   appointment.patient_name,
            receiverId:    appointment.patient_id,
        });

        const handler = onValue(callRef, (snapshot) => {
            const data = snapshot.val();
            if (!data) return;

            if (data.status === 'accepted') {
                clearTimeout(timeoutRef.current);
                off(callRef, 'value', handler);
                setCallingId(null);
                setCallStatus(prev => ({ ...prev, [appointment.id]: 'accepted' }));
                navigation.navigate('VideoCall', { callId: appointment.id.toString() });
            }

            if (data.status === 'rejected') {
                clearTimeout(timeoutRef.current);
                off(callRef, 'value', handler);
                setCallingId(null);
                setCallStatus(prev => ({ ...prev, [appointment.id]: 'rejected' }));
                Alert.alert('📵 Bệnh nhân từ chối cuộc gọi.');
            }
        });

        listenerRef.current = { ref: callRef, handler };

        timeoutRef.current = setTimeout(async () => {
            off(callRef, 'value', handler);
            if (attemptNumber < MAX_ATTEMPTS) {
                Alert.alert(`📞 Lần ${attemptNumber} không bắt máy`, 'Đang gọi lần 2...');
                await update(callRef, { status: `missed_attempt_${attemptNumber}` });
                startCall(appointment, attemptNumber + 1);
            } else {
                await update(callRef, { status: 'no_show' });
                setCallingId(null);
                setCallStatus(prev => ({ ...prev, [appointment.id]: 'no_show' }));
                await markNoShow(appointment.id);
                Alert.alert('❌ Vắng mặt', 'Bệnh nhân không bắt máy sau 2 lần gọi.');
                loadData();
            }
        }, RING_TIMEOUT);
    };

    // ── Huỷ gọi ──────────────────────────────────────
    const cancelCall = async (appointmentId) => {
        clearTimeout(timeoutRef.current);
        if (listenerRef.current) {
            off(listenerRef.current.ref, 'value', listenerRef.current.handler);
        }
        const callRef = ref(db, `calls/${appointmentId}`);
        await update(callRef, { status: 'cancelled' });
        setCallingId(null);
        setCallStatus(prev => ({ ...prev, [appointmentId]: null }));
    };

    // ── Status helpers ────────────────────────────────
    const getStatusColor = (status) => ({
        pending:   '#FF9800',
        confirmed: '#2196F3',
        completed: '#4CAF50',
        cancelled: '#F44336',
        no_show:   '#6B7280',
    }[status] || '#999');

    const getStatusLabel = (status) => ({
        pending:   'Đang chờ',
        confirmed: 'Đã xác nhận',
        completed: 'Đã khám',
        cancelled: 'Đã huỷ',
        no_show:   'Vắng mặt',
    }[status] || status);

    // ── Render appointment ────────────────────────────
    const renderAppointment = ({ item }) => {
        const canCall    = item.type === 'online' && item.status === 'confirmed' &&
                           isToday(item.work_date);
        const isCalling  = callingId === item.id;
        const thisStatus = callStatus[item.id];

        return (
            <Card style={styles.appointmentCard} onPress={() => navigation.navigate('AppointmentDetail', { appointment: item })}>
                <Card.Content>
                    <View style={styles.rowBetween}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.patientName}>{item.patient_name}</Text>
                            <Text style={styles.subText}>🕒 {item.appointment_time}</Text>
                            <Text style={styles.subText}>📋 {item.reason || 'Không có lý do khám'}</Text>
                            <Text style={styles.subText}>
                                {item.type === 'online' ? '💻 Khám online' : '🏥 Tại phòng khám'}
                            </Text>
                        </View>
                        <Chip
                            style={{ backgroundColor: getStatusColor(item.status) }}
                            textStyle={{ color: '#fff' }}
                        >
                            {getStatusLabel(item.status)}
                        </Chip>
                    </View>

                    {/* NÚT GỌI */}
                    {canCall && thisStatus !== 'no_show' && (
                        <View style={{ marginTop: 12 }}>
                            {!isCalling ? (
                                <Button
                                    mode="contained"
                                    icon="phone"
                                    buttonColor="#22C55E"
                                    style={{ borderRadius: 20 }}
                                    onPress={() => startCall(item, 1)}
                                >
                                    Bắt đầu gọi
                                </Button>
                            ) : (
                                <View style={styles.callingRow}>
                                    <RNActivityIndicator size="small" color="#22C55E" />
                                    <Text style={styles.callingText}>
                                        Đang gọi... lần {attempt}/{MAX_ATTEMPTS}
                                    </Text>
                                    <Button
                                        mode="outlined"
                                        icon="phone-hangup"
                                        textColor="#EF4444"
                                        style={{ borderColor: '#EF4444', borderRadius: 20 }}
                                        onPress={() => cancelCall(item.id)}
                                    >
                                        Huỷ
                                    </Button>
                                </View>
                            )}
                        </View>
                    )}

                    {thisStatus === 'no_show'  && <Text style={styles.noShowText}>❌ Bệnh nhân vắng mặt</Text>}
                    {thisStatus === 'accepted' && <Text style={styles.acceptedText}>✅ Đã kết nối</Text>}
                    {thisStatus === 'rejected' && <Text style={styles.noShowText}>📵 Bệnh nhân từ chối</Text>}
                </Card.Content>
            </Card>
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2196F3" />
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
            {/* HEADER */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.greeting}>Xin chào 👋</Text>
                    <Text style={styles.doctorName}>
                        BS. {`${doctor?.first_name || ''} ${doctor?.last_name || ''}`.trim() || '---'}
                    </Text> 
                </View>
                <Avatar.Icon size={70} icon="doctor" style={{ backgroundColor: '#2196F3' }} />
            </View>

            {/* OVERVIEW */}
            <Text style={styles.sectionTitle}>Tổng quan hôm nay</Text>
            <View style={styles.statsContainer}>
                {[
                    { icon: 'clock-outline',  color: '#FF9800', value: overview.total_appointments, label: 'Tổng lịch' },
                    { icon: 'calendar-month', color: '#2196F3', value: overview.confirmed,            label: 'Đã xác nhận' },
                    { icon: 'check-circle',   color: '#4CAF50', value: overview.completed,          label: 'Đã khám' },
                    { icon: 'close-circle',   color: '#F44336', value: overview.no_show,          label: 'Vắng mặt' },
                ].map((s, i) => (
                    <Card key={i} style={styles.statCard}>
                        <Card.Content style={styles.center}>
                            <MaterialCommunityIcons name={s.icon} size={32} color={s.color} />
                            <Text style={styles.statNumber}>{s.value}</Text>
                            <Text style={styles.statLabel}>{s.label}</Text>
                        </Card.Content>
                    </Card>
                ))}
            </View>

            {/* APPOINTMENTS */}
            <Text style={styles.sectionTitle}>Lịch khám hôm nay</Text>
            {appointments.length === 0 ? (
                <Card style={styles.emptyCard}>
                    <Card.Content>
                        <Text style={styles.emptyText}>Không có lịch khám hôm nay</Text>
                    </Card.Content>
                </Card>
            ) : (
                <FlatList
                    data={appointments}
                    renderItem={renderAppointment}
                    keyExtractor={(item) => item.id.toString()}
                    scrollEnabled={false}
                />
            )}

            <View style={{ height: 32 }} />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container:        { flex: 1, backgroundColor: '#F5F7FA', padding: 15 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
    greeting:         { fontSize: 18, color: '#777' },
    doctorName:       { fontSize: 26, fontWeight: 'bold', color: '#222', marginTop: 5 },
    sectionTitle:     { fontSize: 21, fontWeight: 'bold', marginBottom: 15, color: '#222' },
    statsContainer:   { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    statCard:         { width: '48%', marginBottom: 15, borderRadius: 16 },
    center:           { alignItems: 'center' },
    statNumber:       { fontSize: 28, fontWeight: 'bold', marginTop: 10 },
    statLabel:        { marginTop: 5, color: '#666' },
    appointmentCard:  { marginBottom: 12, borderRadius: 15 },
    rowBetween:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    patientName:      { fontSize: 17, fontWeight: 'bold', color: '#222' },
    subText:          { marginTop: 5, color: '#666' },
    emptyCard:        { borderRadius: 15 },
    emptyText:        { textAlign: 'center', color: '#777' },
    callingRow:       { flexDirection: 'row', alignItems: 'center', gap: 8 },
    callingText:      { flex: 1, color: '#22C55E', fontWeight: '600' },
    noShowText:       { marginTop: 8, color: '#EF4444', fontWeight: '600', fontSize: 13 },
    acceptedText:     { marginTop: 8, color: '#22C55E', fontWeight: '600', fontSize: 13 },
});

export default DoctorHomeScreen;