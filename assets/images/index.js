import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, FlatList } from 'react-native';
import { TailwindProvider } from 'tailwindcss-react-native';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebaseCo'; // Make sure this is correct

export default function App() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersCollection = collection(db, 'users');
        const snapshot = await getDocs(usersCollection);
        const usersList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setUsers(usersList);
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  return (
    <TailwindProvider>
      <View style={styles.container}>
        <Text style={styles.title}>Users from Firestore:</Text>
        {loading ? (
          <Text>Loading...</Text>
        ) : (
          <FlatList
            data={users}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <Text style={styles.userItem}>{item.name || 'No name'}</Text>
            )}
          />
        )}
      </View>
    </TailwindProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  userItem: {
    fontSize: 16,
    marginBottom: 10,
  },
});
