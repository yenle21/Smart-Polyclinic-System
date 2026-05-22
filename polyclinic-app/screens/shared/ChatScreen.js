import React, { useEffect, useState, useContext, useRef } from 'react';
import { View, FlatList, StyleSheet, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { Text, TextInput } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { db } from '../../configs/firebase';
import { ref, onValue, push, update, get } from 'firebase/database';
import { MyUserContext } from '../../configs/Contexts';
import COLORS from '../../styles/colors';

export default function ChatScreen({ route }) {
    const { chatId, name } = route.params;
    const [user]          = useContext(MyUserContext);
    const [messages, setMessages] = useState([]);
    const [text,     setText]     = useState('');
    const flatListRef             = useRef(null);

    useEffect(() => {
        const msgsRef = ref(db, `chats/${chatId}/messages`);
        const unsub   = onValue(msgsRef, (snapshot) => {
            const data = snapshot.val();
            if (!data) { setMessages([]); return; }

            const list = Object.entries(data)
                .map(([id, msg]) => ({ id, ...msg }))
                .sort((a, b) => a.timestamp - b.timestamp);
            setMessages(list);

            // ✅ Reset unread khi đang xem chat
            const unreadKey = user?.role === 'patient' ? 'unread_patient' : 'unread_staff';
            update(ref(db, `chats/${chatId}`), { [unreadKey]: 0 });
        });

        return () => unsub();
    }, [chatId, user?.role]);

    const sendMessage = async () => {
        if (!text.trim()) return;

        const trimmed = text.trim();

        const msg = {
            text:         trimmed,
            sender_id:    user?.id,
            sender:       user?.role,
            sender_name:  user?.username, 
            timestamp:    Date.now(),
        };

        await push(ref(db, `chats/${chatId}/messages`), msg);

        // ✅ Lấy unread hiện tại rồi +1
        const unreadKey = user?.role === 'patient' ? 'unread_staff' : 'unread_patient';
        const snapshot  = await get(ref(db, `chats/${chatId}`));
        const current   = snapshot.val()?.[unreadKey] || 0;

        await update(ref(db, `chats/${chatId}`), {
            last_message: trimmed,
            last_time:    Date.now(),
            [unreadKey]:  current + 1,
        });

        setText('');
        setTimeout(() => flatListRef.current?.scrollToEnd(), 100);
    };

    const renderItem = ({ item }) => {
        const isMe = item.sender_id === user?.id;
        return (
            <View style={[styles.msgWrap, isMe ? styles.myWrap : styles.theirWrap]}>
                {/* ✅ Hiển thị tên người gửi */}
                {!isMe && (
                    <Text style={styles.senderName}>
                        {item.sender_name || item.sender || 'Unknown'}
                    </Text>
                )}
                <View style={[styles.bubble, isMe ? styles.myBubble : styles.theirBubble]}>
                    <Text style={[styles.bubbleText, isMe ? styles.myText : styles.theirText]}>
                        {item.text}
                    </Text>
                    <Text style={[styles.time, isMe ? styles.myTime : styles.theirTime]}>
                        {new Date(item.timestamp).toLocaleTimeString('vi-VN',
                            { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={90}
        >
            <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
                ListEmptyComponent={
                    <Text style={styles.empty}>Bắt đầu cuộc trò chuyện!</Text>
                }
            />

            <View style={styles.inputRow}>
                <TextInput
                    value={text}
                    onChangeText={setText}
                    placeholder="Nhập tin nhắn..."
                    style={styles.input}
                    mode="outlined"
                    dense
                    onSubmitEditing={sendMessage}
                />
                <Pressable style={styles.sendBtn} onPress={sendMessage}>
                    <MaterialCommunityIcons name="send" size={24} color="#fff" />
                </Pressable>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container:   { flex: 1, backgroundColor: COLORS.background },
    list:        { padding: 12, paddingBottom: 8 },
    msgWrap:     { marginBottom: 8 },
    myWrap:      { alignItems: 'flex-end' },
    theirWrap:   { alignItems: 'flex-start' },
    senderName:  { fontSize: 11, color: COLORS.gray, marginBottom: 2, marginLeft: 4 },
    bubble:      { maxWidth: '75%', borderRadius: 16, padding: 10 },
    myBubble:    { backgroundColor: COLORS.primary },
    theirBubble: { backgroundColor: '#fff', borderWidth: 1, borderColor: COLORS.border },
    bubbleText:  { fontSize: 15 },
    myText:      { color: '#fff' },
    theirText:   { color: COLORS.text },
    time:        { fontSize: 10, marginTop: 4 },
    myTime:      { color: 'rgba(255,255,255,0.7)', alignSelf: 'flex-end' },
    theirTime:   { color: COLORS.gray, alignSelf: 'flex-end' },
    inputRow:    { flexDirection: 'row', alignItems: 'center', padding: 8,
                   backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: COLORS.border },
    input:       { flex: 1, marginRight: 8, backgroundColor: '#fff' },
    sendBtn:     { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primary,
                   justifyContent: 'center', alignItems: 'center' },
    empty:       { textAlign: 'center', color: COLORS.gray, marginTop: 40 },
});