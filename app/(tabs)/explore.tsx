import { StyleSheet, Text, View } from 'react-native';

export default function ExploreTabScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Другий порожній екран</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 18,
  },
});
