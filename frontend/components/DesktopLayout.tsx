import React from 'react';
import { View, StyleSheet } from 'react-native';

type DesktopLayoutProps = {
  sidebar: React.ReactNode;
  map: React.ReactNode;
};

export default function DesktopLayout({ sidebar, map }: DesktopLayoutProps) {
  return (
    <View style={styles.container}>
      <View style={styles.sidebarSlot}>{sidebar}</View>
      <View style={styles.mapSlot}>{map}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
  },
  sidebarSlot: {
    alignSelf: 'stretch',
  },
  mapSlot: {
    flex: 1,
    alignSelf: 'stretch',
  },
});
