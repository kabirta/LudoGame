import { StyleSheet, Image, Animated, ActivityIndicator } from 'react-native';
import React, { useEffect, useRef, useState } from 'react';
import { deviceHeight, deviceWidth } from '../constants/Scaling';
import Wrapper from '../components/Wrapper';
import logo from '../assets/images/logo.png';  // Ensure the path is correct
import { prepareNavigation, resetAndNavigate } from '../helpers/NavigationUtil';

const SplashScreen = () => {
    const [isStop] = useState(false);
    const scale = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        prepareNavigation();
        setTimeout(() => {
            resetAndNavigate('HomeScreen');
        }, 1500);
    }, []);

    useEffect(() => {
        const breathingAnimation = Animated.loop(
            Animated.sequence([
                Animated.timing(scale, {
                    toValue: 1.1,
                    duration: 2000,
                    useNativeDriver: true,
                }),
                Animated.timing(scale, {
                    toValue: 1,
                    duration: 2000,
                    useNativeDriver: true,
                }),
            ])
        );

        if (!isStop) {
            breathingAnimation.start();
        }

        return () => {
            breathingAnimation.stop();
        };
    }, [isStop, scale]);

    return (
        <Wrapper>
            <Animated.View style={[styles.imgContainer, { transform: [{ scale: scale }] }]}>
                <Image source={logo} style={styles.img} />
            </Animated.View>
            <ActivityIndicator size="small" color="white" />
        </Wrapper>
    );
};

const styles = StyleSheet.create({
    imgContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    img: {
        width: deviceWidth * 0.5,
        height: deviceHeight * 0.3,
        resizeMode: 'contain',
    },
});

export default SplashScreen;
