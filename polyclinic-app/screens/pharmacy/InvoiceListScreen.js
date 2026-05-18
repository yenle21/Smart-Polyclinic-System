import { useEffect, useState } from "react";
import {
    ActivityIndicator, FlatList,
    Text, TouchableOpacity, View
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { authApis, endpoints } from "../../configs/Apis";
import { Card } from "../../components/shared";
import colors from "../../styles/colors";
import globalStyles from "../../styles/globalStyles";

const STATUS_CONFIG = {
    unpaid:    { label: 'Chưa thanh toán', bg: '#FEE2E2', color: colors.danger },
    paid:      { label: 'Đã thanh toán',   bg: '#D1FAE5', color: colors.success },
    cancelled: { label: 'Đã hủy',          bg: '#F3F4F6', color: colors.gray },
};

const FILTERS = [
    { label: 'Tất cả',  value: '' },
    { label: 'Chưa TT', value: 'unpaid' },
    { label: 'Đã TT',   value: 'paid' },
];

const InvoiceListScreen = () => {
    const [invoices,  setInvoices]  = useState([]);
    const [loading,   setLoading]   = useState(false);
    const [page,      setPage]      = useState(1);
    const [filter,    setFilter]    = useState('');
    const nav = useNavigation();

    const loadInvoices = async () => {
        try {
            setLoading(true);
            let url = `${endpoints['invoices']}?page=${page}`;
            if (filter) url = `${url}&status=${filter}`;

            const api = await authApis();
            const res = await api.get(url);

            if (page === 1)
                setInvoices(res.data.results);
            else
                setInvoices(current => [...current, ...res.data.results]);

            if (res.data.next === null)
                setPage(0);
        } catch (ex) {
            console.error(ex);
        } finally {
            setTimeout(() => setLoading(false), 500);
        }
    };

    useEffect(() => {
        let timer = setTimeout(() => {
            if (page > 0) loadInvoices();
        }, 300);
        return () => clearTimeout(timer);
    }, [filter, page]);

    useEffect(() => {
        setPage(1);
    }, [filter]);

    const loadMore = () => {
        if (page > 0 && !loading)
            setPage(page + 1);
    };

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>

            {/* Bộ lọc */}
            <View style={{ flexDirection: 'row', gap: 8, padding: 12 }}>
                {FILTERS.map(f => (
                    <TouchableOpacity
                        key={f.value}
                        style={{
                            flex: 1, paddingVertical: 8, borderRadius: 20,
                            alignItems: 'center',
                            backgroundColor: filter === f.value ? colors.primary : colors.lightGray,
                        }}
                        onPress={() => setFilter(f.value)}
                    >
                        <Text style={{
                            fontSize: 13, fontWeight: '500',
                            color: filter === f.value ? colors.white : colors.text,
                        }}>
                            {f.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <FlatList
                data={invoices}
                onEndReached={loadMore}
                contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 20 }}
                ListFooterComponent={loading && <ActivityIndicator color={colors.primary} />}
                ListEmptyComponent={
                    !loading && (
                        <View style={globalStyles.centered}>
                            <MaterialCommunityIcons name="receipt-text-outline" size={60} color={colors.lightGray} />
                            <Text style={[globalStyles.label, { marginTop: 12 }]}>
                                Không có hóa đơn nào
                            </Text>
                        </View>
                    )
                }
                renderItem={({ item }) => {
                    const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.unpaid;
                    return (
                        <Card onPress={() => nav.navigate('InvoiceDetail', { invoiceId: item.id })}>
                            <View style={globalStyles.rowBetween}>
                                <Text style={[globalStyles.title, { fontSize: 15 }]}>
                                    Hóa đơn #{item.id}
                                </Text>
                                <View style={{ backgroundColor: cfg.bg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 }}>
                                    <Text style={{ fontSize: 11, fontWeight: '600', color: cfg.color }}>
                                        {cfg.label}
                                    </Text>
                                </View>
                            </View>

                            <Text style={[globalStyles.label, { marginVertical: 4 }]}>
                                {item.patient_name}
                            </Text>

                            <View style={globalStyles.rowBetween}>
                                <Text style={[globalStyles.price, { fontSize: 16 }]}>
                                    {Number(item.total_amount).toLocaleString('vi-VN')}đ
                                </Text>
                                <Text style={globalStyles.label}>
                                    {new Date(item.created_date).toLocaleDateString('vi-VN')}
                                </Text>
                            </View>

                            {item.status === 'unpaid' && (
                                <TouchableOpacity
                                    style={{
                                        flexDirection: 'row', alignItems: 'center',
                                        justifyContent: 'center', gap: 6,
                                        backgroundColor: colors.primary,
                                        borderRadius: 8, padding: 8, marginTop: 10,
                                    }}
                                    onPress={() => nav.navigate('Payment', { invoiceId: item.id })}
                                >
                                    <MaterialCommunityIcons name="credit-card" size={16} color={colors.white} />
                                    <Text style={{ color: colors.white, fontWeight: '600', fontSize: 13 }}>
                                        Thanh toán ngay
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </Card>
                    );
                }}
            />
        </View>
    );
};

export default InvoiceListScreen;