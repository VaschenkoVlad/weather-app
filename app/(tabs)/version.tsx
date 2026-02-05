import { useRouter } from 'expo-router';
import React from 'react';
import { Image, ImageBackground, Platform, SafeAreaView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function VersionScreen() {
  const router = useRouter();

  return (
    <ImageBackground source={require('../../assets/images/background-1.png')} style={styles.bg} resizeMode="cover">
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={styles.container}>
        <TouchableOpacity style={styles.back} onPress={() => router.back()}>
          <Image source={require('../../assets/images/Vector.png')} style={styles.backImg} />
        </TouchableOpacity>

        <View style={styles.content}>
          <Text style={styles.title}>App Version</Text>
          <Text style={styles.version}>v1.0.0</Text>
          <Text style={styles.note}>Build date: 2026-02-05</Text>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  container: { flex: 1, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  back: { margin: 16, width: 40, height: 40 },
  backImg: { width: 30, height: 30, tintColor: 'black' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: '600', marginBottom: 8 },
  version: { fontSize: 36, fontWeight: '700', color: '#1E88E5' },
  note: { marginTop: 8, color: '#666' },
});
