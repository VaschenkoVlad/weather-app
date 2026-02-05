import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Image,
    ImageBackground,
    Platform,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function AddLocationScreen() {
  const [searchText, setSearchText] = useState('');
  const router = useRouter();

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

        <View style={styles.searchSection}>
          <View style={styles.searchBar}>
            <Image source={require('../../assets/images/search.png')} style={styles.searchIconImage} />

            <TextInput
              style={styles.input}
              placeholder="Type a city, street or place"
              placeholderTextColor="#5ca8eb"
              value={searchText}
              onChangeText={setSearchText}
            />
          </View>

          <Text style={styles.statusText}>no location found.</Text>
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
    marginBottom: 20,
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
  searchSection: {
    paddingHorizontal: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#42a5f5',
    paddingHorizontal: 15,
    paddingVertical: 10,
    height: 50,
  },
  searchIconImage: {
    width: 20,
    height: 20,
    marginRight: 10,
    resizeMode: 'contain',
    tintColor: '#2196F3',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1565c0',
  },
  statusText: {
    marginTop: 8,
    marginLeft: 15,
    color: '#42a5f5',
    fontSize: 14,
  },
});
