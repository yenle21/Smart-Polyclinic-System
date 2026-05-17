import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import colors from '../../styles/colors';

export default function Button({
    title, onPress, loading = false,
    variant = 'primary', style, disabled
}) {
    const bg = {
        primary:  colors.primary,
        danger:   colors.danger,
        outline:  'transparent',
        gray:     colors.lightGray,
    }[variant] || colors.primary;

    const textColor = variant === 'outline' ? colors.primary
                    : variant === 'gray'    ? colors.text
                    : colors.white;

    const borderColor = variant === 'outline' ? colors.primary : 'transparent';

    return (
        <TouchableOpacity
            style={[styles.btn, { backgroundColor: bg, borderColor, borderWidth: 1.5 }, style]}
            onPress={onPress}
            disabled={loading || disabled}
            activeOpacity={0.8}
        >
            {loading
                ? <ActivityIndicator color={textColor} />
                : <Text style={[styles.text, { color: textColor }]}>{title}</Text>
            }
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    btn:  { borderRadius: 10, padding: 14, alignItems: 'center', justifyContent: 'center' },
    text: { fontWeight: '600', fontSize: 15 },
});