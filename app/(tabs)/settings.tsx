import { useRouter } from 'expo-router';
import React from 'react';
import {
    FlatList,
    Image,
    ImageBackground,
    Platform,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const SETTINGS_DATA = [
  { id: '1', title: 'Units', icon: require('../../assets/images/unita.png') },
  { id: '2', title: 'Hour format', icon: require('../../assets/images/hour.png') },
  { id: '3', title: 'Language', icon: require('../../assets/images/language.png') },
  { id: '4', title: 'Theme', icon: require('../../assets/images/theme.png') },
  { id: '5', title: 'Background style', icon: require('../../assets/images/style.png') },
  { id: '6', title: 'Rate', icon: require('../../assets/images/rate.png') },
  { id: '7', title: 'Version', icon: require('../../assets/images/version.png') },
];

export default function SettingsScreen() {
  const router = useRouter();

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.menuButton} onPress={() => {}}>
      <View style={styles.iconContainer}>
        <Image source={item.icon} style={styles.menuIcon} />
      </View>
      <Text style={styles.menuText}>{item.title}</Text>
    </TouchableOpacity>
  );

  return (
    <ImageBackground
      source={require('../../assets/images/background-1.png')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <StatusBar barStyle="dark-content" />

      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Image source={require('../../assets/images/Vector.png')} style={styles.backIconImage} />
          </TouchableOpacity>
        </View>

        <View style={styles.listContainer}>
          <FlatList
            data={SETTINGS_DATA}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
          />
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  backIconImage: {
    width: 30,
    height: 30,
    resizeMode: 'contain',
    tintColor: 'black',
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  listContent: {
    paddingBottom: 20,
  },
  menuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E88E5',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 15,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  iconContainer: {
    width: 30,
    alignItems: 'center',
    marginRight: 10,
  },
  menuIcon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
    tintColor: 'white',
  },
  menuText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
});
