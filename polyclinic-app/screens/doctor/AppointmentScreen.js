import React, {
    useEffect,
    useState,
    useCallback,
} from 'react';

import {
    View,
    Text,
    FlatList,
    StyleSheet,
    ActivityIndicator,
    RefreshControl,
    TouchableOpacity,
    Alert,
} from 'react-native';

import {
    authApis,
    endpoints,
} from '../../configs/Apis';

const FILTERS = [
    {
        label: 'Đã xác nhận',
        value: 'confirmed',
    },
    {
        label: 'Đã khám xong',
        value: 'completed',
    },
    {
        label: 'Vắng mặt',
        value: 'no_show',
    },
];

const AppointmentScreen = ({ navigation }) => {

    const [appointments, setAppointments] = useState([]);

    const [loading, setLoading] = useState(true);

    const [refreshing, setRefreshing] = useState(false);

    const [activeFilter, setActiveFilter] =
        useState('confirmed');

    // Track which appointment ids are loading no-show
    const [noShowLoadingIds, setNoShowLoadingIds] = useState([]);

    const loadAppointments = async () => {

        try {

            const api = await authApis();

            const res = await api.get(
                endpoints['appointments']
            );

            const data = res.data;

            const list = Array.isArray(data)
                ? data
                : data.results || [];

            setAppointments(list);

        } catch (err) {

            console.log(
                err.response?.data || err
            );

            setAppointments([]);

        } finally {

            setLoading(false);

            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadAppointments();
    }, []);

    const onRefresh = useCallback(() => {

        setRefreshing(true);

        loadAppointments();

    }, []);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const filteredData = appointments.filter(a => {
        if (a.status !== activeFilter) return false;

        // Tab "confirmed" chỉ hiện ngày >= hôm nay
        if (activeFilter === 'confirmed') {
            const workDate = new Date(a.work_date);
            workDate.setHours(0, 0, 0, 0);
            return workDate >= today;
        }

        return true;
    });

    const getStatusStyle = (status) => ({
        confirmed: styles.badgeConfirmed,
        cancelled: styles.badgeCancelled,
        completed: styles.badgeCompleted,
        no_show: styles.badgeNoShow,
        pending: styles.badgePending,
    }[status] || styles.badgePending);

    const getStatusLabel = (status) => ({
        confirmed: 'Đã xác nhận',
        cancelled: 'Đã huỷ',
        completed: 'Đã khám xong',
        no_show: 'Vắng mặt',
        pending: 'Chờ xác nhận',
    }[status] || 'Chờ xác nhận');

    // ─────────────────────────────────────────
    // MARK NO SHOW
    // ─────────────────────────────────────────
    const markNoShow = (appointmentId) => {

        Alert.alert(
            'Xác nhận vắng mặt',
            'Bạn có chắc bệnh nhân này vắng mặt không?',
            [
                {
                    text: 'Huỷ',
                    style: 'cancel',
                },
                {
                    text: 'Xác nhận',
                    style: 'destructive',
                    onPress: async () => {

                        try {

                            setNoShowLoadingIds(prev => [
                                ...prev,
                                appointmentId,
                            ]);

                            const api = await authApis();

                            await api.patch(
                                endpoints['no-show-appointment'](
                                    appointmentId
                                )
                            );

                            // Cập nhật local state thay vì reload toàn bộ
                            setAppointments(prev =>
                                prev.map(a =>
                                    a.id === appointmentId
                                        ? { ...a, status: 'no_show' }
                                        : a
                                )
                            );

                        } catch (err) {

                            console.log(
                                err.response?.data || err
                            );

                            Alert.alert(
                                'Lỗi',
                                'Không thể đánh dấu vắng mặt'
                            );

                        } finally {

                            setNoShowLoadingIds(prev =>
                                prev.filter(id => id !== appointmentId)
                            );
                        }
                    },
                },
            ]
        );
    };

    const renderItem = ({ item }) => {

        const isNoShowLoading = noShowLoadingIds.includes(item.id);

        return (
            <TouchableOpacity
                activeOpacity={0.85}
                onPress={() =>
                    navigation.navigate(
                        'AppointmentDetail',
                        {
                            appointment: item,
                        }
                    )
                }
            >

                <View style={styles.card}>

                    {/* HEADER */}
                    <View style={styles.headerRow}>

                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>
                                {
                                    (item.patient_name || 'U')[0]
                                        .toUpperCase()
                                }
                            </Text>
                        </View>

                        <View style={{ flex: 1 }}>

                            <Text style={styles.name}>
                                {item.patient_name || 'Unknown Patient'}
                            </Text>

                            <Text style={styles.specialty}>
                                {item.specialty_name}
                            </Text>

                        </View>

                        <View
                            style={[
                                styles.badge,
                                getStatusStyle(item.status),
                            ]}
                        >
                            <Text style={styles.badgeText}>
                                {getStatusLabel(item.status)}
                            </Text>
                        </View>

                    </View>

                    {/* BODY */}
                    <View style={styles.infoBox}>

                        <Text style={styles.infoText}>
                            📅 {item.work_date}
                        </Text>

                        <Text style={styles.infoText}>
                            🕒 {item.appointment_time}
                        </Text>

                        <Text style={styles.type}>
                            {
                                item.type === 'online'
                                    ? '💻 Khám online'
                                    : '🏥 Khám tại phòng khám'
                            }
                        </Text>

                    </View>

                    {/* NO SHOW BUTTON — chỉ hiện khi confirmed */}
                    {item.status === 'confirmed' && (
                        <TouchableOpacity
                            style={[
                                styles.noShowBtn,
                                isNoShowLoading && styles.noShowBtnDisabled,
                            ]}
                            onPress={(e) => {
                                e.stopPropagation?.();
                                if (!isNoShowLoading) {
                                    markNoShow(item.id);
                                }
                            }}
                            activeOpacity={0.7}
                        >
                            {isNoShowLoading
                                ? <ActivityIndicator size="small" color="#EF4444" />
                                : (
                                    <Text style={styles.noShowBtnText}>
                                        👤 Đánh dấu vắng mặt
                                    </Text>
                                )
                            }
                        </TouchableOpacity>
                    )}

                </View>

            </TouchableOpacity>
        );
    };

    if (loading) {

        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    return (

        <View style={styles.container}>

            {/* FILTER */}
            <View style={styles.filterRow}>

                {FILTERS.map(f => (

                    <TouchableOpacity
                        key={f.value}
                        style={[
                            styles.filterBtn,
                            activeFilter === f.value &&
                            styles.filterBtnActive,
                        ]}
                        onPress={() =>
                            setActiveFilter(f.value)
                        }
                    >

                        <Text
                            style={[
                                styles.filterText,
                                activeFilter === f.value &&
                                styles.filterTextActive,
                            ]}
                        >
                            {f.label}
                        </Text>

                    </TouchableOpacity>

                ))}

            </View>

            <FlatList
                data={filteredData}
                keyExtractor={item =>
                    item.id.toString()
                }
                renderItem={renderItem}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                    />
                }
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.emptyBox}>
                        <Text style={styles.emptyText}>
                            Không có lịch khám
                        </Text>
                    </View>
                }
            />

        </View>
    );
};

export default AppointmentScreen;

const styles = StyleSheet.create({

    container: {
        flex: 1,
        backgroundColor: '#F5F6FA',
        padding: 12,
    },

    // FILTER
    filterRow: {
        flexDirection: 'row',
        marginBottom: 14,
        gap: 8,
    },

    filterBtn: {
        flex: 1,
        backgroundColor: '#E5E7EB',
        paddingVertical: 9,
        borderRadius: 20,
        alignItems: 'center',
    },

    filterBtnActive: {
        backgroundColor: '#2F6FED',
    },

    filterText: {
        color: '#555',
        fontWeight: '600',
        fontSize: 12,
    },

    filterTextActive: {
        color: '#fff',
    },

    // CARD
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 14,
        marginBottom: 12,

        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 10,
        shadowOffset: {
            width: 0,
            height: 4,
        },

        elevation: 2,
    },

    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },

    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#E8F0FE',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },

    avatarText: {
        fontWeight: 'bold',
        color: '#2F6FED',
        fontSize: 16,
    },

    name: {
        fontWeight: '700',
        fontSize: 15,
        color: '#111',
    },

    specialty: {
        color: '#666',
        marginTop: 2,
        fontSize: 13,
    },

    // BADGE
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
    },

    badgeText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '700',
    },

    badgeConfirmed: {
        backgroundColor: '#22C55E',
    },

    badgeCompleted: {
        backgroundColor: '#2196F3',
    },

    badgeCancelled: {
        backgroundColor: '#EF4444',
    },

    badgePending: {
        backgroundColor: '#F59E0B',
    },

    badgeNoShow: {
        backgroundColor: '#6B7280',
    },

    // INFO
    infoBox: {
        marginTop: 4,
        gap: 4,
    },

    infoText: {
        fontSize: 13,
        color: '#333',
    },

    type: {
        fontSize: 13,
        marginTop: 4,
        color: '#2F6FED',
        fontWeight: '600',
    },

    // NO SHOW BUTTON
    noShowBtn: {
        marginTop: 12,
        borderWidth: 1.5,
        borderColor: '#EF4444',
        borderRadius: 10,
        paddingVertical: 8,
        alignItems: 'center',
        backgroundColor: '#FFF5F5',
        minHeight: 36,
        justifyContent: 'center',
    },

    noShowBtnDisabled: {
        opacity: 0.6,
    },

    noShowBtnText: {
        color: '#EF4444',
        fontWeight: '700',
        fontSize: 13,
    },

    // EMPTY
    emptyBox: {
        marginTop: 80,
        alignItems: 'center',
    },

    emptyText: {
        color: '#888',
        fontSize: 14,
    },

    // LOADING
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});