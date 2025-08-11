import { View, Text } from 'react-native';
import { useTailwind } from 'tailwindcss-react-native';

export default function Home() {
  const tailwind = useTailwind();

  return (
    <View style={tailwind('flex-1 justify-center items-center bg-white')}>
      <Text style={tailwind('text-lg text-blue-500')}>Hello Tailwind!</Text>
    </View>
  );
}
