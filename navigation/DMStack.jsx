import { createStackNavigator } from '@react-navigation/stack';
import ChatScreen from '../screens/Shared/ChatScreen';
import DirectMessageScreen from '../screens/DMStack/DirectMessageScreen';

const Stack = createStackNavigator();

const DMStack = () => {
    return (
        <Stack.Navigator>
            <Stack.Screen name="DirectMessage" component={DirectMessageScreen} options={{ headerShown: false }}/>
            <Stack.Screen name="Chat" component={ChatScreen} options={{ headerShown: false }}/>
        </Stack.Navigator>
    );
};

export default DMStack;
