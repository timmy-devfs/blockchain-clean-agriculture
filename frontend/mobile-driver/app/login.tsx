import React, { useState, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  Switch, ScrollView, Alert, KeyboardAvoidingView, Platform,
} from "react-native";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import * as LocalAuthentication from "expo-local-authentication";
import { useAuth } from "@/hooks/useAuth";
import { EMAIL_KEY, TOKEN_KEY } from "@/lib/api";

export default function LoginScreen() {
  const router = useRouter();
  const { login, isLoading, error } = useAuth();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [hasSavedToken, setHasSavedToken] = useState(false);

  // Kiểm tra biometric + token đã lưu
  useEffect(() => {
    (async () => {
      const [hw, enrolled, token, savedEmail] = await Promise.all([
        LocalAuthentication.hasHardwareAsync(),
        LocalAuthentication.isEnrolledAsync(),
        SecureStore.getItemAsync(TOKEN_KEY),
        SecureStore.getItemAsync(EMAIL_KEY),
      ]);
      setBiometricAvailable(hw && enrolled);
      setHasSavedToken(!!token);
      if (savedEmail) { setEmail(savedEmail); setRemember(true); }
    })();
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập email và mật khẩu");
      return;
    }
    const ok = await login(email, password, remember);
    if (ok) router.replace("/(tabs)");
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <ScrollView
        className="flex-1 bg-gray-900"
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 justify-center px-6 py-12">
          {/* Logo */}
          <View className="items-center mb-10">
            <View className="w-20 h-20 rounded-3xl bg-green-500 items-center justify-center mb-4">
              <Text className="text-4xl">🚚</Text>
            </View>
            <Text className="text-white text-2xl font-bold">BICAP Driver</Text>
            <Text className="text-gray-400 text-sm mt-1">Ứng dụng giao hàng</Text>
          </View>

          {/* Form card */}
          <View className="bg-white rounded-3xl p-6 shadow-2xl">
            {/* Email */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-1.5">Email</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="driver@bicap.io"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                className="border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-900 focus:border-green-500"
              />
            </View>

            {/* Password */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-1.5">Mật khẩu</Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                //placeholder="••••••••"
                placeholder="pass test: 123123"
                secureTextEntry
                className="border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-900"
              />
            </View>

            {/* Remember Me */}
            <View className="flex-row items-center justify-between mb-5">
              <Text className="text-sm text-gray-600">Ghi nhớ đăng nhập</Text>
              <Switch
                value={remember}
                onValueChange={setRemember}
                trackColor={{ false: "#d1d5db", true: "#22c55e" }}
                thumbColor="#ffffff"
              />
            </View>

            {/* Error */}
            {error && (
              <View className="mb-4 bg-red-50 rounded-xl px-4 py-3">
                <Text className="text-red-600 text-sm">{error}</Text>
              </View>
            )}

            {/* Login Button */}
            <TouchableOpacity
              onPress={handleLogin}
              disabled={isLoading}
              className={`rounded-2xl py-4 items-center mb-3 ${
                isLoading ? "bg-green-300" : "bg-green-500"
              }`}
              activeOpacity={0.8}
            >
              <Text className="text-white font-semibold text-base">
                {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}