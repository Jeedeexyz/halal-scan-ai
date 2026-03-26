import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { useDrawerStatus } from '@react-navigation/drawer';
import { Menu } from 'lucide-react-native';

export function HeaderMenuButton() {
  const navigation = useNavigation();
  const drawerStatus = useDrawerStatus();
  const isOpen = drawerStatus === 'open';

  // Keep same header space when drawer is open
  if (isOpen) return <View style={styles.placeholder} />;

  return (
    <Pressable
      onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}
      style={styles.btn}
      hitSlop={10}
    >
      <Menu size={22} color="#111827" strokeWidth={2.2} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    marginLeft: 12,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholder: {
    marginLeft: 12,
    width: 32,
    height: 32,
  },
});