import React, { useEffect, useState, useCallback } from 'react';
import { View, FlatList, StyleSheet, RefreshControl, Pressable } from 'react-native';
import { Searchbar, Text, FAB, Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { authApis, endpoints } from '../../configs/Apis';

const COLORS = {
    primary: '#1D9E75',
    danger:  '#EF4444',
    gray:    '#6B7280',
    background: '#F3F4F6',
};

export default function CategoryListScreen({ navigation }) {
    const [categories, setCategories] = useState([]);
    const [loading,    setLoading]    = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search,     setSearch]     = useState('');
    const [alertCount, setAlertCount] = useState(0);

    const fetchCategories = useCallback(async () => {
        try {
            const api = await authApis();
            const res = await api.get(endpoints['categories'], { params: { q: search } });
            setCategories(res.data.results || res.data);
        } catch (err) {
            console.error('fetchCategories:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [search]);

    const fetchAlertCount = async () => {
        try {
            const api = await authApis();
            const res = await api.get(endpoints['alerts']);
            const count = res.data.low_stock.count
                        + res.data.expiring_soon.count
                        + res.data.expired.count;
            setAlertCount(count);
        } catch (err) {}
    };

    useEffect(() => {
        fetchCategories();
        fetchAlertCount();
    }, [fetchCategories]);

    const renderItem = ({ item }) => (
        <Pressable
            style={styles.card}
            onPress={() => navigation.navigate('MedicineList', {
                categoryId:   item.id,
                categoryName: item.name,
            })}
        >
            <View style={styles.cardContent}>
                <View style={styles.iconBox}>
                    <MaterialCommunityIcons name="pill" size={28} color={COLORS.primary} />
                </View>
                <View style={styles.textBox}>
                    <Text variant="titleMedium" style={styles.name}>{item.name}</Text>
                    {item.description ? (
                        <Text variant="bodySmall" style={styles.desc} numberOfLines={1}>
                            {item.description}
                        </Text>
                    ) : null}
                    <Text variant="bodySmall" style={styles.count}>
                        {item.medicine_count ?? 0} loại thuốc
                    </Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS.gray} />
            </View>
        </Pressable>
    );

    return (
        <View style={styles.container}>
            <Searchbar
                placeholder="Tìm danh mục..."
                value={search}
                onChangeText={setSearch}
                onSubmitEditing={fetchCategories}
                style={styles.searchbar}
            />

            {alertCount > 0 && (
                <Chip
                    icon="bell-alert"
                    style={styles.alertBanner}
                    textStyle={{ color: COLORS.danger }}
                    onPress={() => navigation.navigate('Alert')}
                >
                    {alertCount} cảnh báo tồn kho — nhấn để xem
                </Chip>
            )}

            <FlatList
                data={categories}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => { setRefreshing(true); fetchCategories(); }}
                    />
                }
                ListEmptyComponent={
                    <Text style={styles.empty}>Không có danh mục nào</Text>
                }
            />

            <FAB
                icon="plus"
                style={styles.fab}
                onPress={() => navigation.navigate('MedicineForm', { medicine: null })}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container:   { flex: 1, backgroundColor: COLORS.background },
    searchbar:   { margin: 12, borderRadius: 10 },
    alertBanner: { marginHorizontal: 12, marginBottom: 8, backgroundColor: '#FEE2E2' },
    list:        { paddingHorizontal: 12, paddingBottom: 80 },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        marginBottom: 10,
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
    },
    cardContent: { flexDirection: 'row', alignItems: 'center', padding: 14 },
    iconBox: {
        width: 48, height: 48, borderRadius: 24,
        backgroundColor: '#E8F5F0',
        justifyContent: 'center', alignItems: 'center', marginRight: 12,
    },
    textBox: { flex: 1 },
    name:    { fontWeight: 'bold', color: '#1a1a1a' },
    desc:    { color: COLORS.gray, marginTop: 2 },
    count:   { color: COLORS.primary, marginTop: 2 },
    empty:   { textAlign: 'center', color: COLORS.gray, marginTop: 40 },
    fab:     { position: 'absolute', right: 16, bottom: 16, backgroundColor: COLORS.primary },
});