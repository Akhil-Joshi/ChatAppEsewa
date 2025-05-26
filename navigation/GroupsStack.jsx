import { createStackNavigator } from '@react-navigation/stack';
import ChatScreen from '../screens/Shared/ChatScreen';
import GroupsScreen from '../screens/GroupStack/GroupScreen';

const Stack = createStackNavigator();

const  GroupStack= () => {
    return (
        <Stack.Navigator>
            <Stack.Screen name="GroupChat" component={GroupsScreen} options={{ headerShown: false }}/>
            <Stack.Screen name="Chat" component={ChatScreen} options={{ headerShown: false }}/>
        </Stack.Navigator>
    );
};

export default GroupStack;
