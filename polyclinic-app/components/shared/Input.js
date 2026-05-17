import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import colors from '../../styles/colors';

export default function Input({
    label, value, onChangeText, placeholder,
    secureTextEntry, keyboardType, multiline,
    error, editable = true, style
}) {
    return (
        <View style={[styles.wrap, style]}>
            {label && <Text style={styles.label}>{label}</Text>}
            <TextInput
                style={[
                    styles.input,
                    multiline  && { height: 100, textAlignVertical: 'top' },
                    !editable  && { backgroundColor: colors.lightGray },
                    error      && { borderColor: colors.danger },
                ]}
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor={colors.gray}
                secureTextEntry={secureTextEntry}
                keyboardType={keyboardType}
                multiline={multiline}
                editable={editable}
            />
            {error && <Text style={styles.error}>{error}</Text>}
        </View>
    );
}

const styles = StyleSheet.create({
    wrap:  { marginBottom: 12 },
    label: { fontSize: 13, fontWeight: '500', color: colors.text, marginBottom: 6 },
    input: {
        borderWidth: 1, borderColor: colors.border,
        borderRadius: 8, padding: 12,
        fontSize: 14, color: colors.text,
        backgroundColor: colors.white,
    },
    error: { fontSize: 11, color: colors.danger, marginTop: 4 },
});