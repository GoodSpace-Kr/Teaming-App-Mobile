import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { router } from 'expo-router';
import TeamAvatars from '../../src/components/TeamAvatars';

export default function SplashScreen() {
  const animate = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 메인 애니메이션 (5초 반복)
    const mainAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(animate, {
          toValue: 1,
          duration: 5000,
          useNativeDriver: false,
        }),
        Animated.timing(animate, {
          toValue: 0,
          duration: 5000,
          useNativeDriver: false,
        }),
      ])
    );

    // 펄스 애니메이션 (1초 반복)
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    mainAnimation.start();
    pulseAnimation.start();

    // 3초 후 로그인 전 화면으로 이동
    const timer = setTimeout(() => {
      router.replace('/(auth)');
    }, 3000);

    return () => {
      mainAnimation.stop();
      pulseAnimation.stop();
      clearTimeout(timer);
    };
  }, []);

  const pulseOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 1],
  });

  const pulseScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.95, 1.05],
  });

  return (
    <View style={styles.container}>
      {/* 메인 콘텐츠 */}
      <View style={styles.content}>
        {/* 팀 아바타 모티브 */}
        <Animated.View
          style={[
            styles.avatarContainer,
            {
              opacity: pulseOpacity,
              transform: [{ scale: pulseScale }],
            },
          ]}
        >
          <TeamAvatars />
        </Animated.View>

        {/* 로고 + 카피 */}
        <View style={styles.textContainer}>
          <Text style={styles.logoText}>Teaming</Text>
          <Text style={styles.subtitleText}>함께라서 더 완벽한 팀플</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  avatarContainer: {
    marginBottom: 32,
  },
  textContainer: {
    alignItems: 'center',
  },
  logoText: {
    fontSize: 38,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 10,
    fontFamily: 'System',
  },
  subtitleText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.75)',
    fontFamily: 'System',
  },
});
