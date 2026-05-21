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
        label: 'Đã huỷ',
        value: 'cancelled',
    },
];

const AppointmentScreen = ({ navigation }) => {

    const [appointments, setAppointments] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    const [refreshing, setRefreshing] =
        useState(false);

    const [activeFilter, setActiveFilter] =
        useState('confirmed');

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

    const filteredData =
        appointments.filter(
            a => a.status === activeFilter
        );

    const renderItem = ({ item }) => {

        const badgeStyle =
            item.status === 'confirmed'
                ? styles.badgeConfirmed
                : item.status === 'completed'
                    ? styles.badgeCompleted
                    : styles.badgeCancelled;

        const badgeText =
            item.status === 'confirmed'
                ? 'Đã xác nhận'
                : item.status === 'completed'
                    ? 'Đã khám xong'
                    : 'Đã huỷ';

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

                    <View style={styles.row}>

                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>
                                {
                                    item.patient_name?.[0]
                                        ?.toUpperCase()
                                }
                            </Text>
                        </View>

                        <View style={{ flex: 1 }}>

                            <Text style={styles.name}>
                                {item.patient_name}
                            </Text>

                            <Text style={styles.specialty}>
                                {item.specialty_name}
                            </Text>

                        </View>

                        <View
                            style={[
                                styles.badge,
                                badgeStyle,
                            ]}
                        >
                            <Text style={styles.badgeText}>
                                {badgeText}
                            </Text>
                        </View>

                    </View>

                    <View style={styles.infoBox}>

                        <Text style={styles.info}>
                            📅 {item.work_date}
                        </Text>

                        <Text style={styles.info}>
                            🕒 {item.appointment_time}
                        </Text>

                    </View>

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

    filterRow: {
        flexDirection: 'row',
        marginBottom: 12,
        gap: 8,
    },

    filterBtn: {
        flex: 1,
        backgroundColor: '#E5E7EB',
        paddingVertical: 8,
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

    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 14,
        marginBottom: 12,
        elevation: 2,
    },

    row: {
        flexDirection: 'row',
        alignItems: 'center',
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
    },

    name: {
        fontWeight: '700',
        fontSize: 15,
        color: '#111',
    },

    specialty: {
        color: '#666',
        marginTop: 2,
    },

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
        backgroundColor: '#3B82F6',
    },

    badgeCancelled: {
        backgroundColor: '#EF4444',
    },

    infoBox: {
        marginTop: 10,
        gap: 4,
    },

    info: {
        color: '#333',
    },

    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});