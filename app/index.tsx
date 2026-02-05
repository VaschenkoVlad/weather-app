import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function OnboardingScreen() {
  const router = useRouter();

  function goToMain() {
    router.replace('/(tabs)');
  }

  return (
    <View style={styles.container}>
      <View style={styles.phone}>
        <View style={styles.iconPlaceholder}>
          <Text style={styles.iconText}>🌤️</Text>
        </View>

        <Text style={styles.title}>Weather app</Text>

        <View style={styles.buttons}>
          <Pressable style={styles.button} onPress={goToMain} accessibilityLabel="Find my location">
            <Text style={styles.buttonText}>Find my location</Text>
          </Pressable>

          <Pressable style={styles.button} onPress={goToMain} accessibilityLabel="Search location">
            <Text style={styles.buttonText}>Search location</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#b3b3b3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  phone: {
    width: 320,
    height: 640,
    backgroundColor: '#fff',
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  iconPlaceholder: {
    marginBottom: 30,
  },
  iconText: {
    fontSize: 80,
  },
  title: {
    fontSize: 28,
    fontWeight: '500',
    marginBottom: 50,
    color: '#222',
  },
  buttons: {
    gap: 15,
  },
  button: {
    width: 180,
    paddingVertical: 14,
    backgroundColor: '#2196f3',
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
  },
});
