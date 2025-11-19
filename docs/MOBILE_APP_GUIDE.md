# Mobile Application Development Guide

This guide provides instructions for building native mobile applications for Mahakavya Social Platform.

## Overview

While the platform has a fully functional PWA (Progressive Web App), native mobile apps provide better performance, native features, and app store presence.

## Technology Stack Recommendations

### React Native (Recommended)
- **Pros**: Code sharing with web app, large ecosystem, hot reload
- **Cons**: Bridge performance for complex animations
- **Best for**: MVP and cross-platform development

### Flutter
- **Pros**: Excellent performance, beautiful UI, single codebase
- **Cons**: Different language (Dart), smaller ecosystem
- **Best for**: Performance-critical features, custom UI

### Native (Swift/Kotlin)
- **Pros**: Best performance, full platform access
- **Cons**: Separate codebases, higher development cost
- **Best for**: Platform-specific features

## Architecture

\`\`\`
mobile-app/
├── src/
│   ├── screens/          # Screen components
│   ├── components/       # Reusable UI components
│   ├── navigation/       # Navigation setup
│   ├── services/         # API services
│   ├── state/           # State management (Redux/Zustand)
│   ├── hooks/           # Custom hooks
│   ├── utils/           # Utility functions
│   └── theme/           # Styling and theming
├── ios/                 # iOS native code
├── android/             # Android native code
└── assets/              # Images, fonts, etc.
\`\`\`

## API Integration

All APIs are already REST-compliant and ready for mobile consumption.

### Base Configuration
\`\`\`typescript
const API_BASE_URL = "https://mahakavya.vercel.app/api"

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})
\`\`\`

### Authentication
\`\`\`typescript
// Store token in secure storage
import * as SecureStore from 'expo-secure-store'

async function login(email: string, password: string) {
  const response = await apiClient.post('/auth/login', { email, password })
  await SecureStore.setItemAsync('auth_token', response.data.token)
  return response.data
}
\`\`\`

## Key Features to Implement

### 1. Push Notifications
- Use Firebase Cloud Messaging (FCM)
- Register device tokens via `/api/push/register`
- Handle notification taps

### 2. Offline Support
- Use AsyncStorage or SQLite
- Cache feed data
- Queue actions for later sync

### 3. Media Upload
- Use react-native-image-picker
- Compress images/videos before upload
- Show upload progress

### 4. Real-time Features
- WebSocket connection to Supabase Realtime
- Live chat, notifications, presence

### 5. Native Features
- Camera access for stories/reels
- Biometric authentication
- Share extensions
- Background location (for events)

## Performance Optimization

### Image Loading
\`\`\`typescript
import FastImage from 'react-native-fast-image'

<FastImage
  source={{ uri: imageUrl }}
  resizeMode={FastImage.resizeMode.cover}
/>
\`\`\`

### List Virtualization
\`\`\`typescript
import { FlatList } from 'react-native'

<FlatList
  data={posts}
  renderItem={({ item }) => <PostCard post={item} />}
  keyExtractor={(item) => item.id}
  maxToRenderPerBatch={10}
  windowSize={5}
/>
\`\`\`

### Code Splitting
\`\`\`typescript
const HomeScreen = lazy(() => import('./screens/HomeScreen'))
\`\`\`

## Deep Linking

Configure deep links for seamless navigation from web to app.

\`\`\`typescript
// app.json
{
  "expo": {
    "scheme": "mahakavya",
    "android": {
      "intentFilters": [
        {
          "action": "VIEW",
          "data": {
            "scheme": "https",
            "host": "mahakavya.vercel.app"
          }
        }
      ]
    }
  }
}
\`\`\`

## Testing

### Unit Tests
- Jest for business logic
- React Native Testing Library for components

### E2E Tests
- Detox for iOS/Android
- Test critical user flows

## Deployment

### iOS
1. Apple Developer Account required
2. Configure app in App Store Connect
3. Build with Xcode or EAS
4. Submit for review

### Android
1. Google Play Developer Account
2. Configure app in Play Console
3. Build signed APK/AAB
4. Submit for review

## Next Steps

1. Set up React Native project: `npx create-expo-app mahakavya-mobile`
2. Install dependencies (navigation, UI library, etc.)
3. Implement authentication flow
4. Build core screens (feed, profile, messaging)
5. Add native features
6. Test on real devices
7. Submit to app stores

## Resources

- [React Native Docs](https://reactnative.dev)
- [Expo Documentation](https://docs.expo.dev)
- [Supabase React Native Guide](https://supabase.com/docs/guides/getting-started/tutorials/with-expo-react-native)
