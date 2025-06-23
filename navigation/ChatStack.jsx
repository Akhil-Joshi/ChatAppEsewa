import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from '../screens/ChatStack/HomeScreen';
import ChatScreen from '../screens/Shared/ChatScreen';
import ProfileScreen from '../screens/Profile/Profile';
import GroupChatScreen from '../screens/GroupStack/GroupChatScreen';

const Stack = createStackNavigator();

const ChatStack = () => {
    return (
        <Stack.Navigator>
            <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }}/>
            <Stack.Screen name="Chat" component={ChatScreen} options={{ headerShown: false }}/>
            <Stack.Screen name="Profile" component={ProfileScreen} options={{ headerShown: false }}/>
            <Stack.Screen name="GroupChatScreen" component={GroupChatScreen} options={{ headerShown: false }}/>
        </Stack.Navigator>
    );
};

export default ChatStack;
