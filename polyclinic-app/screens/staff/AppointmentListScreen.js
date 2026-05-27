import React, { useEffect, useState, useCallback } from 'react';
import { View, FlatList, StyleSheet, RefreshControl, ScrollView } from 'react-native';
import { Card, Text, Chip, Searchbar, Button } from 'react-native-paper';
import { authApis } from '../../configs/Apis';
import COLORS from '../../styles/colors';

const STATUS_OPTIONS = [
    { label: 'Chờ duyệt',  value: 'pending',   color: '#F59E0B' },
    { label: 'Đã duyệt',   value: 'confirmed',  color: '#10B981' },
    { label: 'Đã hủy',     value: 'cancelled',  color: '#EF4444' },
    { label: 'Hoàn thành', value: 'completed',  color: '#6B7280' },
    { label: 'Vắng mặt',   value: 'no_show',    color: '#8B5CF6' },
    { label: 'Tất cả',     value: '',           color: '#185FA5' },
];

export default function AppointmentListScreen({ navigation }) {
    const [appointments, setAppointments] = useState([]);
    const [refreshing,   setRefreshing]   = useState(false);
    const [search,       setSearch]       = useState('');
    const [status,       setStatus]       = useState('pending'); 

    const fetchAppointments = useCallback(async () => {
        try {
            const api    = await authApis();
            const params = { q: search };
            if (status) params.status = status;  
            const res = await api.get('/appointments/', { params });
            
            
            const data = res.data.results || res.data;
            const filtered = status ? data.filter(a => a.status === status) : data;
            setAppointments(filtered);
        } catch (err) {
            console.error('fetchAppointments:', err);
        } finally {
            setRefreshing(false);
        }
    }, [search, status]);
    useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

    const handleApprove = async (id) => {
        try {
            const api = await authApis();
            await api.patch(`/appointments/${id}/approve/`, { status: 'confirmed' });
            fetchAppointments();
        } catch (err) { console.error(err); }
    };

    const renderItem = ({ item }) => {
        const s = STATUS_OPTIONS.find(o => o.value === item.status) || { label: item.status, color: '#888' };
        return (
            <Card style={styles.card}
                  onPress={() => navigation.navigate('AppointmentDetail', { id: item.id })}>
                <Card.Content>
                    <View style={styles.row}>
                        <Text variant="titleMedium" style={styles.name}>
                            {item.patient_name || 'Bệnh nhân'}
                        </Text>
                        <Chip textStyle={{ color: s.color, fontSize: 11 }}
                              style={{ backgroundColor: s.color + '20' }}>
                            {s.label}
                        </Chip>
                    </View>
                    <Text style={styles.info}>🩺 {item.doctor_name || '---'}</Text>
                    <Text style={styles.info}>📅 {item.schedule?.work_date} — {item.appointment_time}</Text>
                    <Text style={styles.info}>🏥 {item.type === 'offline' ? 'Khám trực tiếp' : 'Khám trực tuyến'}</Text>
                    {item.reason ? <Text style={styles.info}>📋 {item.reason}</Text> : null}

                    {item.status === 'pending' && (
                        <Button mode="contained" onPress={() => handleApprove(item.id)}
                                style={styles.btn} buttonColor={COLORS.primary}>
                            Duyệt lịch hẹn
                        </Button>
                    )}
                </Card.Content>
            </Card>
        );
    };

    return (
        <View style={styles.container}>
       
            <Searchbar
                placeholder="Tìm bệnh nhân..."
                value={search}
                onChangeText={setSearch}
                onSubmitEditing={fetchAppointments}
                style={styles.searchbar}
            />

            
            <ScrollView horizontal showsHorizontalScrollIndicator={false}
                        style={styles.filterRow} contentContainerStyle={styles.filterContent}>
                {STATUS_OPTIONS.map((opt) => (
                    <Chip
                        key={opt.value}
                        selected={status === opt.value}
                        onPress={() => setStatus(opt.value)}
                        style={[
                            styles.filterChip,
                            status === opt.value && { backgroundColor: opt.color }
                        ]}
                        textStyle={{
                            color: status === opt.value ? '#fff' : opt.color,
                            fontSize: 12,
                        }}
                    >
                        {opt.label}
                    </Chip>
                ))}
            </ScrollView>

        
            <FlatList
                data={appointments}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl refreshing={refreshing}
                        onRefresh={() => { setRefreshing(true); fetchAppointments(); }} />
                }
                ListEmptyComponent={
                    <Text style={styles.empty}>Không có lịch hẹn nào</Text>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container:     { flex: 1, backgroundColor: COLORS.background },
    searchbar:     { margin: 12, marginBottom: 8, borderRadius: 10 },
    filterRow:     { maxHeight: 50 },
    filterContent: { paddingHorizontal: 12, paddingBottom: 8, gap: 8, flexDirection: 'row' },
    filterChip:    { borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: COLORS.border },
    list:          { paddingHorizontal: 12, paddingBottom: 20 },
    card:          { marginBottom: 10, borderRadius: 12 },
    row:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    name:          { fontWeight: 'bold', flex: 1 },
    info:          { color: COLORS.gray, marginTop: 4, fontSize: 13 },
    btn:           { marginTop: 10, borderRadius: 8 },
    empty:         { textAlign: 'center', color: COLORS.gray, marginTop: 40 },
});