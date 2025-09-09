import { useEffect } from 'react';
import { Redirect } from 'expo-router';

export default function Index() {
  useEffect(() => {
    // 스플래시 스크린으로 리다이렉트
  }, []);

  return <Redirect href="/(splash)" />;
}
