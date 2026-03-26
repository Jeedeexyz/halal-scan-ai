import React from 'react';
import { Linking, Pressable, StyleSheet, Text, View, Image } from 'react-native';
import type { ChatMessage } from '@/types/chat';

export function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === 'user';

  return (
    <View style={[styles.row, isUser ? styles.rowUser : styles.rowBot]}>
      <View style={[styles.bubble, isUser ? styles.user : styles.bot]}>
        {!!msg.imageUri && <Image source={{ uri: msg.imageUri }} style={styles.image} />}
        <Text style={styles.text}>{msg.text}</Text>

        {!isUser && msg.payload?.evidences?.length ? (
          <View style={styles.refs}>
            {msg.payload.evidences.slice(0, 3).map((e, i) => (
              <Pressable key={i} onPress={() => e.url && Linking.openURL(e.url)}>
                <Text style={styles.link}>• {e.citation}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { paddingHorizontal: 12, marginBottom: 10 },
  rowUser: { alignItems: 'flex-end' },
  rowBot: { alignItems: 'flex-start' },
  bubble: { maxWidth: '88%', borderRadius: 14, padding: 10 },
  user: { backgroundColor: '#d3d9e6' },
  bot: { backgroundColor: '#F3F4F6' },
  text: { color: '#111827' },
  image: { width: 180, height: 120, borderRadius: 10, marginBottom: 8 },
  refs: { marginTop: 8, gap: 4 },
  link: { color: '#2563EB', fontSize: 12 },
});