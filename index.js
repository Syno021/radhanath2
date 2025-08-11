// index.js
import { AppRegistry } from 'react-native';
import Landing from './src/Landing'; // Adjust path to your Landing.jsx
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => Landing);
