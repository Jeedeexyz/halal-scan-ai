import React from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Camera, ImagePlus, Send } from 'lucide-react-native';

export function ChatInput({
  value,
  onChange,
  onSend,
  onCamera,
  onGallery,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  onCamera: () => void;
  onGallery: () => void;
  disabled?: boolean;
}) {
  return (
    <View style={styles.wrap}>
      <Pressable onPress={onCamera} style={styles.iconBtn}><Camera size={18} color="#111827" /></Pressable>
      <Pressable onPress={onGallery} style={styles.iconBtn}><ImagePlus size={18} color="#111827" /></Pressable>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder="Ask anything..."
        placeholderTextColor="#6B7280"
        style={styles.input}
        multiline
      />
      <Pressable onPress={onSend} style={[styles.send, disabled && { opacity: 0.4 }]} disabled={disabled}>
        <Send size={18} color="#fff" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, padding: 10, borderTopWidth: 1, borderTopColor: '#E5E7EB', backgroundColor: '#fff' },
  iconBtn: { width: 34, height: 34, borderRadius: 8, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  input: { flex: 1, minHeight: 38, maxHeight: 120, backgroundColor: '#F9FAFB', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, color: '#111827', fontSize: 14 },
  send: { width: 34, height: 34, borderRadius: 8, backgroundColor: '#111827', alignItems: 'center', justifyContent: 'center' },
});