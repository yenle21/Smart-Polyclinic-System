import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    ActivityIndicator,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { Card, Chip, Divider, Button, RadioButton } from 'react-native-paper';
import * as WebBrowser from 'expo-web-browser';
import { authApis, endpoints } from '../../configs/Apis';

const STATUS_COLOR = {
    unpaid: '#FF9800',
    paid:   '#4CAF50',
};

const ALL_METHODS = [
    { value: 'cash',     label: 'Tiền mặt' },
    { value: 'transfer', label: 'Chuyển khoản' },
    { value: 'momo',     label: 'MoMo' },
    { value: 'vnpay',    label: 'VNPay' },
];

// Khám online → không cho tiền mặt
const ONLINE_METHODS = ALL_METHODS.filter(m => m.value !== 'cash');

// Các phương thức cần redirect ra ngoài
const REDIRECT_METHODS = ['momo', 'vnpay'];

const InvoiceScreen = () => {
    const [invoices, setInvoices]     = useState([]);
    const [loading, setLoading]       = useState(false);
    const [expanded, setExpanded]     = useState(null);
    const [payingId, setPayingId]     = useState(null);
    const [payMethod, setPayMethod]   = useState('cash');
    const [payLoading, setPayLoading] = useState(false);

    useEffect(() => {
        loadInvoices();
    }, []);

    const loadInvoices = async () => {
        try {
            setLoading(true);
            const api = await authApis();
            const res = await api.get(endpoints['invoices']);
            const data = Array.isArray(res.data)
                ? res.data
                : (res.data.results ?? []);
            setInvoices(data);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '---';
        const d = new Date(dateStr);
        return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
    };

    const formatMoney = (amount) => {
        if (!amount) return '0 ₫';
        return Math.round(Number(amount)).toLocaleString('vi-VN') + ' ₫';
    };

    const toggleExpand = (id) => {
        setExpanded(prev => prev === id ? null : id);
    };

    const openPay = (inv) => {
        const methods = inv.appointment_type === 'online' ? ONLINE_METHODS : ALL_METHODS;
        setPayMethod(methods[0].value);
        setPayingId(inv.id);
    };

    const confirmPay = (inv) => {
        const methodLabel = ALL_METHODS.find(m => m.value === payMethod)?.label || payMethod;
        Alert.alert(
            'Xác nhận thanh toán',
            `Thanh toán ${formatMoney(inv.total_amount)} bằng ${methodLabel}?`,
            [
                { text: 'Hủy', style: 'cancel' },
                { text: 'Xác nhận', onPress: () => doPay(inv.id) },
            ]
        );
    };

    // =============================================
    // XỬ LÝ THANH TOÁN
    // =============================================
    const doPay = async (id) => {
        try {
            setPayLoading(true);
            const api = await authApis();
            const res = await api.post(endpoints['pay-invoice'](id), {
                payment_method: payMethod,
            });

            // MoMo / VNPay → mở browser
            if (REDIRECT_METHODS.includes(payMethod)) {
                const paymentUrl = res.data?.payment_url;

                if (!paymentUrl) {
                    Alert.alert('Lỗi', 'Không nhận được link thanh toán.');
                    return;
                }

                // Mở trang thanh toán
                await WebBrowser.openBrowserAsync(paymentUrl);

                // Sau khi user đóng browser → kiểm tra kết quả
                await checkPaymentResult(id);
            } else {
                // Tiền mặt / chuyển khoản → xong luôn
                Alert.alert('Thành công', 'Thanh toán hóa đơn thành công!');
                setPayingId(null);
                loadInvoices();
            }

        } catch (ex) {
            const msg = ex.response?.data?.error
                || ex.response?.data?.detail
                || 'Thanh toán thất bại!';
            Alert.alert('Lỗi', msg);
        } finally {
            setPayLoading(false);
        }
    };

    // =============================================
    // KIỂM TRA KẾT QUẢ SAU KHI ĐÓNG BROWSER
    // =============================================
    const checkPaymentResult = async (id) => {
        try {
            const api = await authApis();
            const res = await api.get(endpoints['invoice-detail'](id));
            const invoice = res.data;

            if (invoice.status === 'paid') {
                Alert.alert('Thành công 🎉', 'Thanh toán thành công!');
                setPayingId(null);
                loadInvoices();
            } else {
                Alert.alert(
                    'Chưa hoàn tất',
                    'Giao dịch chưa được xác nhận. Vui lòng kiểm tra lại.',
                    [
                        { text: 'Đóng', style: 'cancel' },
                        { text: 'Thử lại', onPress: () => openPay({ id, appointment_type: null }) },
                    ]
                );
            }
        } catch {
            Alert.alert('Lỗi', 'Không thể kiểm tra trạng thái hóa đơn.');
        }
    };

    return (
        <ScrollView style={{ flex: 1, backgroundColor: '#F5F7FA', padding: 16 }}>

            <Text style={{
                fontSize: 20, fontWeight: '700',
                color: '#1565C0', marginBottom: 16,
            }}>
                🧾 Hóa đơn của tôi
            </Text>

            {loading && (
                <ActivityIndicator size="large" color="#1565C0" style={{ marginTop: 40 }} />
            )}

            {!loading && invoices.length === 0 && (
                <View style={{ alignItems: 'center', marginTop: 60 }}>
                    <Text style={{ fontSize: 40 }}>📭</Text>
                    <Text style={{ color: 'gray', marginTop: 8 }}>
                        Bạn chưa có hóa đơn nào
                    </Text>
                </View>
            )}

            {!loading && invoices.map(inv => {
                const isOnline = inv.appointment_type === 'online';
                const methods  = isOnline ? ONLINE_METHODS : ALL_METHODS;

                return (
                    <Card key={inv.id} style={{
                        marginBottom: 12,
                        borderRadius: 12,
                        elevation: 2,
                    }}>
                        <Card.Content>

                            {/* HEADER */}
                            <View style={{
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: 8,
                            }}>
                                <Text style={{ fontWeight: '700', fontSize: 15, flex: 1 }}>
                                    👨‍⚕️ {inv.doctor_name}
                                </Text>
                                <Chip
                                    style={{ backgroundColor: STATUS_COLOR[inv.status] + '22' }}
                                    textStyle={{ color: STATUS_COLOR[inv.status], fontSize: 11, fontWeight: '700' }}
                                >
                                    {inv.status_display}
                                </Chip>
                            </View>

                            <Text style={{ color: '#555', marginBottom: 2 }}>
                                🏥 {inv.specialty_name}
                            </Text>
                            <Text style={{ color: '#555', marginBottom: 2 }}>
                                📅 {formatDate(inv.created_date)}
                            </Text>
                            <Text style={{ color: '#555', marginBottom: 8 }}>
                                🏷️ Khám {isOnline ? 'online' : 'trực tiếp'}
                            </Text>

                            <Divider style={{ marginBottom: 8 }} />

                            {/* TỔNG TIỀN + NÚT CHI TIẾT */}
                            <View style={{
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                            }}>
                                <Text style={{ fontWeight: '700', fontSize: 16, color: '#1565C0' }}>
                                    Tổng: {formatMoney(inv.total_amount)}
                                </Text>
                                <TouchableOpacity onPress={() => toggleExpand(inv.id)}>
                                    <Text style={{ color: '#1565C0', fontSize: 12 }}>
                                        {expanded === inv.id ? '▲ Ẩn' : '▼ Chi tiết'}
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            {/* CHI TIẾT */}
                            {expanded === inv.id && (
                                <View style={{
                                    marginTop: 12,
                                    backgroundColor: '#E3F2FD',
                                    borderRadius: 8,
                                    padding: 12,
                                }}>
                                    <Row label="Phí khám"    value={formatMoney(inv.consultation_fee)} />
                                    <Row label="Phí thuốc"   value={formatMoney(inv.medicine_fee)} />
                                    <Row label="Phí dịch vụ" value={formatMoney(inv.service_fee)} />

                                    <Divider style={{ marginVertical: 8 }} />

                                    <Row label="Tổng cộng" value={formatMoney(inv.total_amount)} bold />

                                    {inv.paid_at && (
                                        <Row label="Thanh toán lúc" value={formatDate(inv.paid_at)} />
                                    )}

                                    {inv.notes ? (
                                        <Row label="Ghi chú" value={inv.notes} />
                                    ) : null}

                                    {/* DANH SÁCH THUỐC */}
                                    {inv.items && inv.items.length > 0 && (
                                        <View style={{ marginTop: 8 }}>
                                            <Text style={{ fontWeight: '700', marginBottom: 6, color: '#1565C0' }}>
                                                💊 Danh sách thuốc
                                            </Text>
                                            {inv.items.map((item, idx) => (
                                                <View key={idx} style={{
                                                    flexDirection: 'row',
                                                    justifyContent: 'space-between',
                                                    marginBottom: 4,
                                                }}>
                                                    <Text style={{ flex: 1, color: '#333' }}>
                                                        {item.medicine_name} x{item.quantity}
                                                    </Text>
                                                    <Text style={{ color: '#333' }}>
                                                        {formatMoney(item.subtotal)}
                                                    </Text>
                                                </View>
                                            ))}
                                        </View>
                                    )}
                                </View>
                            )}

                            {/* THANH TOÁN */}
                            {inv.status === 'unpaid' && (
                                <View style={{ marginTop: 12 }}>

                                    {payingId === inv.id ? (
                                        <View style={{
                                            backgroundColor: '#FFF8E1',
                                            borderRadius: 8,
                                            padding: 12,
                                        }}>
                                            <Text style={{ fontWeight: '700', marginBottom: 8, color: '#E65100' }}>
                                                Chọn phương thức thanh toán
                                            </Text>

                                            {isOnline && (
                                                <Text style={{ color: '#888', fontSize: 12, marginBottom: 8 }}>
                                                    ℹ️ Khám online không hỗ trợ thanh toán tiền mặt
                                                </Text>
                                            )}

                                            <RadioButton.Group
                                                value={payMethod}
                                                onValueChange={setPayMethod}
                                            >
                                                {methods.map(m => (
                                                    <View key={m.value} style={{
                                                        flexDirection: 'row',
                                                        alignItems: 'center',
                                                        marginBottom: 4,
                                                    }}>
                                                        <RadioButton value={m.value} />
                                                        <Text style={{ fontSize: 14 }}>{m.label}</Text>
                                                    </View>
                                                ))}
                                            </RadioButton.Group>

                                            {/* Ghi chú cho MoMo / VNPay */}
                                            {REDIRECT_METHODS.includes(payMethod) && (
                                                <Text style={{
                                                    color: '#1565C0',
                                                    fontSize: 12,
                                                    marginTop: 6,
                                                    marginBottom: 2,
                                                }}>
                                                    🔗 Bạn sẽ được chuyển đến trang thanh toán {payMethod === 'momo' ? 'MoMo' : 'VNPay'}
                                                </Text>
                                            )}

                                            <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                                                <Button
                                                    mode="contained"
                                                    buttonColor="#4CAF50"
                                                    loading={payLoading}
                                                    disabled={payLoading}
                                                    style={{ flex: 1, borderRadius: 8 }}
                                                    onPress={() => confirmPay(inv)}
                                                >
                                                    Thanh toán
                                                </Button>
                                                <Button
                                                    mode="outlined"
                                                    style={{ flex: 1, borderRadius: 8 }}
                                                    disabled={payLoading}
                                                    onPress={() => setPayingId(null)}
                                                >
                                                    Hủy
                                                </Button>
                                            </View>
                                        </View>
                                    ) : (
                                        <Button
                                            mode="contained"
                                            buttonColor="#FF9800"
                                            icon="credit-card"
                                            style={{ borderRadius: 8 }}
                                            onPress={() => openPay(inv)}
                                        >
                                            Thanh toán hóa đơn
                                        </Button>
                                    )}

                                </View>
                            )}

                        </Card.Content>
                    </Card>
                );
            })}

            <View style={{ height: 32 }} />
        </ScrollView>
    );
};

const Row = ({ label, value, bold }) => (
    <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 6,
    }}>
        <Text style={{ color: 'gray', fontSize: 13 }}>{label}</Text>
        <Text style={{
            fontSize: 13,
            fontWeight: bold ? '700' : '500',
            color: bold ? '#1565C0' : '#222',
        }}>
            {value}
        </Text>
    </View>
);

export default InvoiceScreen;