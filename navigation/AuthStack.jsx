import { createStackNavigator } from '@react-navigation/stack';
import Welcome from '../screens/AuthStack/Welcome';
import Login from '../screens/AuthStack/Login';
import Signup from '../screens/AuthStack/Signup';
// import OTP from '../screens/AuthStack/OTP';
// import ForgotPassword from '../screens/AuthStack/ForgotPassword';


const Stack = createStackNavigator();

const ChatStack = () => {
    return (
        <Stack.Navigator>
            <Stack.Screen name="Welcome" component={Welcome} options={{ headerShown: false }}/>
            <Stack.Screen name="Login" component={Login} options={{ headerShown: false }}/>
            <Stack.Screen name="Signup" component={Signup} options={{ headerShown: false }}/>
            {/* Add other screens here as needed */}
        </Stack.Navigator>
    );
};

export default ChatStack;