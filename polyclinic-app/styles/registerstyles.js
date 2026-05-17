import { StyleSheet } from 'react-native';

const registerstyles = StyleSheet.create({
    container: {
        flexGrow: 1,
        backgroundColor: '#F5F7FA',
        justifyContent: 'center',
        paddingHorizontal: 24,
        paddingVertical: 40,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 20,
        elevation: 5,
    },
    cardTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1A237E',
        marginBottom: 4,
        textAlign: 'center',
    },
    cardSub: {
        fontSize: 13,
        color: '#90A4AE',
        marginBottom: 20,
        textAlign: 'center',
    },

    // ── Avatar ─────────────────────────────────────
    avatarWrap: {
        alignSelf: 'center',
        marginBottom: 20,
        position: 'relative',
    },
    avatarImg: {
        width: 90,
        height: 90,
        borderRadius: 45,
        borderWidth: 3,
        borderColor: '#1565C0',
    },
    avatarPlaceholder: {
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: '#E8F0FE',
        borderWidth: 2,
        borderColor: '#BBDEFB',
        borderStyle: 'dashed',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarIcon: { fontSize: 24 },
    avatarText: { fontSize: 11, color: '#90A4AE', marginTop: 2 },
    avatarBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: '#1565C0',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#fff',
    },
    avatarBadgeText: { fontSize: 11 },

    // ── Input ─────────────────────────────────────
    input: {
        backgroundColor: '#F5F7FA',
        marginBottom: 12,
    },

    // ── Button ────────────────────────────────────
    registerBtn: {
        marginTop: 4,
        borderRadius: 10,
        paddingVertical: 4,
        backgroundColor: '#1565C0',
    },
    registerBtnLabel: {
        fontSize: 15,
        fontWeight: '700',
        letterSpacing: 0.5,
    },

    // ── Link login ────────────────────────────────
    loginRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 16,
    },
    loginText: {
        fontSize: 13,
        color: '#90A4AE',
    },
    loginLink: {
        fontSize: 13,
        color: '#1565C0',
        fontWeight: '700',
    },
});

export default registerstyles;