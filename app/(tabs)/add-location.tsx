import { useRouter } from 'expo-router';
import React, { useState, useCallback } from 'react';
import {
    FlatList,
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

import { geocodeCity, GeoResult } from '../../services/weather';
import { useLocation } from '../../constants/location-context';

export default function AddLocationScreen() {
  const [searchText, setSearchText] = useState('');
  const [results, setResults] = useState<GeoResult[]>([]);
  const [status, setStatus] = useState('');
  const router = useRouter();
  const { setLocation } = useLocation();

  const handleSearch = useCallback(async (text: string) => {
    setSearchText(text);
    if (text.trim().length < 2) {
      setResults([]);
      setStatus('');
      return;
    }
    setStatus('Searching...');
    try {
      const data = await geocodeCity(text);
      setResults(data);
      setStatus(data.length === 0 ? 'no location found.' : '');
    } catch {
      setStatus('Error searching');
    }
  }, []);

  function selectLocation(item: GeoResult) {
    const parts = item.display_name.split(',');
    const city = parts[0];
    const country = parts.length > 1 ? parts[parts.length - 1].trim() : '';
    setLocation({
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      city,
      country,
    });
    router.back();
  }

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
              onChangeText={handleSearch}
            />
          </View>

          {status ? (
            <Text style={styles.statusText}>{status}</Text>
          ) : null}

          <FlatList
            data={results}
            keyExtractor={(_, i) => String(i)}
            style={styles.resultsList}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.resultItem} onPress={() => selectLocation(item)}>
                <Text style={styles.resultText}>{item.display_name}</Text>
              </TouchableOpacity>
            )}
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
  resultsList: {
    marginTop: 10,
    maxHeight: 400,
  },
  resultItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
  },
  resultText: {
    color: '#1565c0',
    fontSize: 14,
  },
});
