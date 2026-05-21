import React, {
    useEffect,
    useState,
} from 'react';

import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
} from 'react-native';

import {
    ActivityIndicator,
} from 'react-native-paper';

import {
    authApis,
    endpoints,
} from '../../configs/Apis';

const MedicalRecordListScreen = ({
    navigation,
}) => {

    const [records, setRecords] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    // =========================
    // LOAD RECORDS
    // =========================
    useEffect(() => {

        const loadRecords = async () => {

            try {

                const api =
                    await authApis();

                const res =
                    await api.get(
                        endpoints['medical-records']
                    );

                const data =
                    Array.isArray(res.data)
                        ? res.data
                        : res.data.results || [];

                setRecords(data);

            } catch (err) {

                console.log(
                    err.response?.data || err
                );

            } finally {

                setLoading(false);
            }
        };

        loadRecords();

    }, []);

    // =========================
    // FORMAT DATE
    // =========================
    const formatDate = (dateString) => {

        const d = new Date(dateString);

        return d.toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        });
    };

    // =========================
    // RENDER ITEM
    // =========================
    const renderItem = ({ item }) => (

        <TouchableOpacity
            activeOpacity={0.85}
            onPress={() =>
                // ✅ FIX: truyền cả object record thay vì chỉ recordId
                navigation.navigate(
                    'MedicalRecordDetailTab',
                    {
                        record: item,
                    }
                )
            }
        >

            <View style={styles.card}>

                {/* TOP */}
                <View style={styles.topRow}>

                    <View style={styles.avatar}>

                        <Text style={styles.avatarText}>
                            {item.patient_name
                                ?.charAt(0)
                                ?.toUpperCase() || 'P'}
                        </Text>

                    </View>

                    <View style={{ flex: 1 }}>

                        <Text style={styles.name}>
                            {item.patient_name ||
                                'Bệnh nhân'}
                        </Text>

                        <Text style={styles.specialty}>
                            🩺 {
                                item.specialty_name ||
                                'Không có chuyên khoa'
                            }
                        </Text>

                    </View>

                </View>

                {/* DIAGNOSIS */}
                <View style={styles.infoBox}>

                    <Text style={styles.label}>
                        Chẩn đoán
                    </Text>

                    <Text style={styles.diagnosis}>
                        {item.diagnosis}
                    </Text>

                </View>

                {/* DATE */}
                <View style={styles.dateRow}>

                    <Text style={styles.date}>
                        📅 {
                            formatDate(
                                item.created_date
                            )
                        }
                    </Text>

                </View>

            </View>

        </TouchableOpacity>
    );

    // =========================
    // LOADING
    // =========================
    if (loading) {

        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    return (

        <View style={styles.container}>

            {/* TITLE */}
            <Text style={styles.title}>
                Hồ sơ bệnh nhân
            </Text>

            <FlatList
                data={records}
                keyExtractor={(item) =>
                    item.id.toString()
                }
                renderItem={renderItem}
                contentContainerStyle={{
                    paddingBottom: 20,
                }}
                ListEmptyComponent={
                    <View style={styles.center}>
                        <Text>
                            Không có hồ sơ bệnh án
                        </Text>
                    </View>
                }
            />

        </View>
    );
};

export default MedicalRecordListScreen;

const styles = StyleSheet.create({

    container: {
        flex: 1,
        backgroundColor: '#F5F6FA',
        padding: 14,
    },

    title: {
        fontSize: 28,
        fontWeight: '800',
        color: '#111',
        marginBottom: 18,
        marginTop: 6,
    },

    card: {
        backgroundColor: '#fff',
        borderRadius: 22,
        padding: 18,
        marginBottom: 14,

        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 10,
        shadowOffset: {
            width: 0,
            height: 4,
        },

        elevation: 3,
    },

    topRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    avatar: {
        width: 54,
        height: 54,
        borderRadius: 27,
        backgroundColor: '#E8F0FE',

        justifyContent: 'center',
        alignItems: 'center',

        marginRight: 14,
    },

    avatarText: {
        fontSize: 20,
        fontWeight: '700',
        color: '#2F6FED',
    },

    name: {
        fontSize: 17,
        fontWeight: '700',
        color: '#111',
    },

    specialty: {
        fontSize: 13,
        color: '#666',
        marginTop: 4,
    },

    infoBox: {
        marginTop: 18,
        backgroundColor: '#F8FAFC',
        borderRadius: 14,
        padding: 14,
    },

    label: {
        fontSize: 12,
        color: '#666',
        marginBottom: 6,
    },

    diagnosis: {
        fontSize: 15,
        fontWeight: '600',
        color: '#111',
        lineHeight: 22,
    },

    dateRow: {
        marginTop: 16,
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },

    date: {
        fontSize: 13,
        color: '#666',
    },

    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 40,
    },
});