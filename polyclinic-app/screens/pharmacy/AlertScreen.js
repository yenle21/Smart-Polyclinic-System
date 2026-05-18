import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { authApis, endpoints } from "../../configs/Apis";
import { Card } from "../../components/shared";
import colors from "../../styles/colors";
import globalStyles from "../../styles/globalStyles";

const AlertScreen = () => {
    const [alerts,  setAlerts]  = useState(null);
    const [loading, setLoading] = useState(false);

    const loadAlerts = async () => {
        try {
            setLoading(true);
            const api = await authApis();
            const res = await api.get(endpoints['alerts']);
            setAlerts(res.data);
        } catch (ex) {
            console.error(ex);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAlerts();
    }, []);

    if (loading || !alerts) {
        return (
            <View style={globalStyles.centered}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    const AlertSection = ({ title, color, icon, items, renderRow }) => (
        <Card style={{ borderLeftWidth: 4, borderLeftColor: color, marginBottom: 12 }}>
            <View style={[globalStyles.row, { gap: 8, marginBottom: 10 }]}>
                <MaterialCommunityIcons name={icon} size={20} color={color} />
                <Text style={[globalStyles.title, { fontSize: 14, color }]}>
                    {title} ({items.length})
                </Text>
            </View>
            {items.length === 0
                ? <Text style={[globalStyles.label, { fontStyle: 'italic' }]}>Không có</Text>
                : items.map((item, i) => (
                    <View key={i} style={{
                        paddingVertical: 6,
                        borderBottomWidth: i < items.length - 1 ? 0.5 : 0,
                        borderBottomColor: colors.border,
                    }}>
                        {renderRow(item)}
                    </View>
                ))
            }
        </Card>
    );

    return (
        <ScrollView
            style={globalStyles.container}
            contentContainerStyle={{ padding: 12 }}
        >
            <AlertSection
                title="Tồn kho thấp"
                color={colors.warning}
                icon="package-variant-alert"
                items={alerts.low_stock.items}
                renderRow={(item) => (
                    <View style={globalStyles.rowBetween}>
                        <Text style={{ fontSize: 13, flex: 1 }}>{item.name}</Text>
                        <Text style={{ color: colors.warning, fontSize: 12, fontWeight: '600' }}>
                            Còn {item.quantity} — thiếu {item.shortage}
                        </Text>
                    </View>
                )}
            />

            <AlertSection
                title="Sắp hết hạn"
                color={colors.danger}
                icon="calendar-alert"
                items={alerts.expiring_soon.items}
                renderRow={(item) => (
                    <View style={globalStyles.rowBetween}>
                        <Text style={{ fontSize: 13, flex: 1 }}>{item.name}</Text>
                        <Text style={{ color: colors.danger, fontSize: 12, fontWeight: '600' }}>
                            Còn {item.days_remaining} ngày
                        </Text>
                    </View>
                )}
            />

            <AlertSection
                title="Đã hết hạn"
                color={colors.gray}
                icon="close-circle"
                items={alerts.expired.items}
                renderRow={(item) => (
                    <View style={globalStyles.rowBetween}>
                        <Text style={{ fontSize: 13, flex: 1 }}>{item.name}</Text>
                        <Text style={{ color: colors.gray, fontSize: 12 }}>
                            {item.expiry_date}
                        </Text>
                    </View>
                )}
            />
        </ScrollView>
    );
};

export default AlertScreen;