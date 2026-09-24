import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
  Image,
} from "react-native";

import { supabase } from "./services/supabase";
import HomeScreen from "./screens/HomeScreen";
import CocktailScreen from "./screens/CocktailScreen";
import CommunityScreen from "./screens/CommunityScreen";
import CreateCocktailScreen from "./screens/CreateCocktailScreen";
import ProfileScreen from "./screens/ProfileScreen";
import SearchScreen from "./screens/SearchScreen";


export default function App() {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [selectedCocktail, setSelectedCocktail] = useState(null);
  const [community, setCommunity] = useState(false);
  const [createCocktail, setCreateCocktail] = useState(false);
  const [profile, setProfile] = useState(false);
  const [cocktailOrigin, setCocktailOrigin] = useState(null);
  const [search, setSearch] = useState(false);
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1800);

    const getSession = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
    };

    getSession();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => {
      clearTimeout(timer);
      listener.subscription.unsubscribe();
    };
    }, []);

    if (loading) {
      return <SplashScreen />;
    }

    if (!session) {
      return <LoginScreen />;
    }

  if (createCocktail) {
  return (
    <CreateCocktailScreen
      session={session}
      onBack={() => setCreateCocktail(false)}
    />
  );
}

if (selectedCocktail) {
  return (
    <CocktailScreen
      cocktail={selectedCocktail}
      onBack={() => setSelectedCocktail(null)}
    />
  );
}

if (community) {
  return (
    <CommunityScreen
      onBack={() => setCommunity(false)}
      onSelectCocktail={(cocktail) => {
        setSelectedCocktail(cocktail);
        setCommunity(false);
      }}
      onCreateCocktail={() => setCreateCocktail(true)}
    />
  );
  }
  if (search) {
  return (
    <SearchScreen
      initialSearch={searchText}
      onBack={() => {
        setSearch(false);
        setSearchText("");
      }}
      onSelectCocktail={(cocktail) => {
        setCocktailOrigin("search");
        setSelectedCocktail(cocktail);
        setSearch(false);
      }}
    />
  );
}
  if (profile) {
  return (
    <ProfileScreen
      session={session}
      onBack={() => setProfile(false)}
      onSelectCocktail={(cocktail) => {
        setSelectedCocktail(cocktail);
        setProfile(false);
      }}
      onLogout={async () => {
        await supabase.auth.signOut();
      }}
    />
  );
}
return (
  <HomeScreen
  session={session}
  onSelectCocktail={(cocktail) => {
    setCocktailOrigin("home");
    setSelectedCocktail(cocktail);
  }}
  onOpenCommunity={() => setCommunity(true)}
  onOpenProfile={() => setProfile(true)}
  onSearch={(text) => {
    setSearchText(text);
    setSearch(true);
  }}
/>
);
}

/* pantalla splash */
function SplashScreen() {
  return (
    <View style={styles.splash}>
      <Image
        source={require("./assets/logo.png")}
        style={styles.splashLogo}
      />

      <Text style={styles.splashTitle}>
        CALTRAGO
      </Text>
    </View>
  );
}

/* pantalla login */
function LoginScreen() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [register, setRegister] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    if (!email || !password || (register && !username)) {
      Alert.alert(
        "Caltrago",
        "Completa todos los campos."
      );
      return;
    }

    setLoading(true);

    if (register) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
          },
        },
      });

      if (error) {
        Alert.alert("Error", error.message);
      } else {
        Alert.alert(
          "Caltrago",
          "Cuenta creada correctamente."
        );
      }
    } else {
      const { error } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (error) {
        Alert.alert("Error", error.message);
      }
    }

    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.authContainer}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#FF555A"
      />

      <View style={styles.authBox}>
        <Image
          source={require("./assets/logo.png")}
          style={styles.authLogo}
        />

        <Text style={styles.authTitle}>
          CALTRAGO
        </Text>

        <Text style={styles.authSubtitle}>
          {register
            ? "Crea tu cuenta"
            : "Iniciá sesión"}
        </Text>

        {register && (
          <TextInput
            style={styles.authInput}
            placeholder="Nombre de usuario"
            placeholderTextColor="#999"
            value={username}
            onChangeText={setUsername}
          />
        )}

        <TextInput
          style={styles.authInput}
          placeholder="Correo electrónico"
          placeholderTextColor="#999"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        <TextInput
          style={styles.authInput}
          placeholder="Contraseña"
          placeholderTextColor="#999"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity
          style={styles.authButton}
          onPress={handleAuth}
          disabled={loading}
        >
          <Text style={styles.authButtonText}>
            {loading
              ? "Cargando..."
              : register
              ? "Registrarme"
              : "Iniciar sesión"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setRegister(!register)}
        >
          <Text style={styles.authChange}>
            {register
              ? "Ya tengo una cuenta"
              : "Crear una cuenta"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

/* estilos del App */
const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: "#FF555A",
    justifyContent: "center",
    alignItems: "center",
  },

  splashLogo: {
    width: 100,
    height: 100,
    resizeMode: "contain",
  },

  splashTitle: {
    color: "white",
    fontSize: 42,
    fontWeight: "900",
    marginTop: 10,
  },

  authContainer: {
    flex: 1,
    backgroundColor: "#FF555A",
  },

  authBox: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 35,
  },

  authLogo: {
    width: 75,
    height: 75,
    resizeMode: "contain",
  },

  authTitle: {
    color: "white",
    fontSize: 42,
    fontWeight: "900",
    marginTop: 5,
    marginBottom: 10,
  },

  authSubtitle: {
    color: "white",
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 25,
  },

  authInput: {
    width: "100%",
    height: 52,
    backgroundColor: "white",
    borderRadius: 25,
    paddingHorizontal: 20,
    marginBottom: 12,
    fontSize: 16,
  },

  authButton: {
    width: "100%",
    height: 52,
    backgroundColor: "#111",
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },

  authButtonText: {
    color: "white",
    fontSize: 17,
    fontWeight: "800",
  },

  authChange: {
    color: "white",
    fontSize: 15,
    fontWeight: "700",
    marginTop: 20,
    textDecorationLine: "underline",
  },
});