import React, { useEffect, useState } from "react";

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";

import * as ImagePicker from "expo-image-picker";
import { File } from "expo-file-system";

import { Ionicons } from "@expo/vector-icons";

import { supabase } from "../services/supabase";

export default function ProfileScreen({
  session,
  onBack,
  onSelectCocktail,
  onLogout,
}) {
  const [profile, setProfile] = useState(null);
  const [cocktailsCount, setCocktailsCount] = useState(0);
  const [favorites, setFavorites] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [editingUsername, setEditingUsername] =
    useState(false);

  const [editingEmail, setEditingEmail] =
    useState(false);

  const [editingPassword, setEditingPassword] =
    useState(false);

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (session?.user?.id) {
      loadProfile();
    }
  }, [session]);

  const loadProfile = async () => {
    setLoading(true);

    try {
      const userId = session.user.id;

      const { data: profileData, error: profileError } =
        await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .maybeSingle();

      if (profileError) {
        console.log(
          "Error cargando perfil:",
          profileError
        );
      }

      if (profileData) {
        setProfile(profileData);
        setUsername(profileData.username || "");
      }
      if (profileData) {
        console.log("PERFIL CARGADO:", profileData);

        setProfile(profileData);
        setUsername(profileData.username || "");
        }

      setEmail(session.user.email || "");

      const { count, error: countError } =
        await supabase
          .from("cocktails")
          .select("*", {
            count: "exact",
            head: true,
          })
          .eq("created_by", userId);

      if (countError) {
        console.log(
          "Error contando tragos:",
          countError
        );
      } else {
        setCocktailsCount(count || 0);
      }

      const { data: favoritesData, error: favoritesError } =
        await supabase
          .from("favorites")
          .select(`
            cocktail_id,
            cocktails (
              id,
              name,
              description,
              image_url,
              preparation_time
            )
          `)
          .eq("user_id", userId)
          .order("created_at", {
            ascending: false,
          });

      if (favoritesError) {
        console.log(
          "Error cargando favoritos:",
          favoritesError
        );
      } else {
        setFavorites(
          (favoritesData || [])
            .map((item) => item.cocktails)
            .filter(Boolean)
        );
      }
    } catch (error) {
      console.log(
        "Error general cargando perfil:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  const saveUsername = async () => {
    const cleanUsername = username.trim();

    if (!cleanUsername) {
      Alert.alert(
        "Caltrago",
        "El nombre de usuario no puede estar vacío."
      );
      return;
    }

    setSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        username: cleanUsername,
      })
      .eq("id", session.user.id);

    setSaving(false);

    if (error) {
      Alert.alert(
        "Error",
        error.message
      );
      return;
    }

    setProfile({
      ...profile,
      username: cleanUsername,
    });

    setEditingUsername(false);

    Alert.alert(
      "Listo",
      "Tu nombre de usuario fue actualizado."
    );
  };

  const saveEmail = async () => {
    const cleanEmail = email.trim();

    if (!cleanEmail) {
      Alert.alert(
        "Caltrago",
        "Ingresá un correo válido."
      );
      return;
    }

    setSaving(true);

    const { error } =
      await supabase.auth.updateUser({
        email: cleanEmail,
      });

    setSaving(false);

    if (error) {
      Alert.alert(
        "Error",
        error.message
      );
      return;
    }

    setEditingEmail(false);

    Alert.alert(
      "Correo actualizado",
      "Puede que Supabase te pida confirmar el nuevo correo desde tu email."
    );
  };

  const savePassword = async () => {
    if (password.length < 6) {
      Alert.alert(
        "Caltrago",
        "La contraseña debe tener al menos 6 caracteres."
      );
      return;
    }

    setSaving(true);

    const { error } =
      await supabase.auth.updateUser({
        password,
      });

    setSaving(false);

    if (error) {
      Alert.alert(
        "Error",
        error.message
      );
      return;
    }

    setPassword("");
    setEditingPassword(false);

    Alert.alert(
      "Listo",
      "Tu contraseña fue actualizada."
    );
  };

  const pickProfileImage = async () => {
    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        "Permiso necesario",
        "Necesitamos permiso para acceder a tus imágenes."
      );
      return;
    }

    const result =
      await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: false,
      });

    if (result.canceled) {
      return;
    }

    const asset = result.assets[0];

    try {
      setSaving(true);

      const file = new File(asset.uri);

      if (!file.exists) {
        throw new Error(
          "No se encontró el archivo de imagen."
        );
      }

      const arrayBuffer =
        await file.arrayBuffer();

      const extension =
        asset.fileName
          ?.split(".")
          .pop() || "jpg";

      const fileName =
        `${session.user.id}-${Date.now()}.${extension}`;

      const { error: uploadError } =
        await supabase.storage
          .from("profile-images")
          .upload(
            fileName,
            arrayBuffer,
            {
              contentType:
                asset.mimeType ||
                "image/jpeg",
              upsert: true,
            }
          );

      if (uploadError) {
        throw uploadError;
      }

      const { data } =
        supabase.storage
          .from("profile-images")
          .getPublicUrl(fileName);

      const avatarUrl =
        data.publicUrl;

      const { error: updateError } =
        await supabase
          .from("profiles")
          .update({
            avatar_url: avatarUrl,
          })
          .eq("id", session.user.id);

      if (updateError) {
        throw updateError;
      }

      setProfile({
        ...profile,
        avatar_url: avatarUrl,
      });

      Alert.alert(
        "Listo",
        "Tu foto de perfil fue actualizada."
      );
    } catch (error) {
      console.log(
        "Error cambiando foto:",
        error
      );

      Alert.alert(
        "Error",
        error.message ||
          "No se pudo cambiar la foto."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color="#FF555A"
        />

        <Text style={styles.loadingText}>
          Cargando perfil...
        </Text>
      </View>
    );
  }

  const avatarUrl =
    profile?.avatar_url;

  const displayName =
    profile?.username ||
    "Usuario";

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={onBack}
          style={styles.backButton}
        >
          <Ionicons
            name="arrow-back"
            size={28}
            color="white"
          />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          Perfil
        </Text>

        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* foto y nombre */}

        <View style={styles.profileTop}>
          <TouchableOpacity
            style={styles.avatarContainer}
            onPress={pickProfileImage}
            disabled={saving}
          >
            {avatarUrl ? (
              <Image
                source={{
                  uri: avatarUrl,
                }}
                style={styles.avatar}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons
                  name="person"
                  size={55}
                  color="#FF555A"
                />
              </View>
            )}

            <View style={styles.cameraButton}>
              <Ionicons
                name="camera"
                size={18}
                color="white"
              />
            </View>
          </TouchableOpacity>

          <Text style={styles.profileName}>
            {displayName}
          </Text>

          <Text style={styles.profileEmail}>
            {session.user.email}
          </Text>
        </View>

        {/* estadisticas */}

        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>
              {cocktailsCount}
            </Text>

            <Text style={styles.statLabel}>
              Tragos aportados
            </Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.stat}>
            <Text style={styles.statNumber}>
              {favorites.length}
            </Text>

            <Text style={styles.statLabel}>
              Favoritos
            </Text>
          </View>
        </View>

        {/* cuenta */}

        <Text style={styles.sectionTitle}>
          Mi cuenta
        </Text>

        {/* nmombre de usuario */}

        <View style={styles.settingCard}>
          <View style={styles.settingIcon}>
            <Ionicons
                name="person-outline"
                size={22}
                color="#FF555A"
            />
            </View>

          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>
              Nombre de usuario
            </Text>

            {editingUsername ? (
              <TextInput
                style={styles.editInput}
                value={username}
                onChangeText={setUsername}
                autoFocus
                placeholder="Nombre de usuario"
              />
            ) : (
              <Text style={styles.settingValue}>
                {displayName}
              </Text>
            )}
          </View>

          <TouchableOpacity
            onPress={
              editingUsername
                ? saveUsername
                : () =>
                    setEditingUsername(true)
            }
            disabled={saving}
          >
            <Text style={styles.editText}>
              {editingUsername
                ? "Guardar"
                : "Editar"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* mail */}

        <View style={styles.settingCard}>
          <View style={styles.settingIcon}>
            <Ionicons
              name="mail-outline"
              size={22}
              color="#FF555A"
            />
          </View>

          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>
              Correo electrónico
            </Text>

            {editingEmail ? (
              <TextInput
                style={styles.editInput}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoFocus
              />
            ) : (
              <Text
                style={styles.settingValue}
                numberOfLines={1}
              >
                {session.user.email}
              </Text>
            )}
          </View>

          <TouchableOpacity
            onPress={
              editingEmail
                ? saveEmail
                : () =>
                    setEditingEmail(true)
            }
            disabled={saving}
          >
            <Text style={styles.editText}>
              {editingEmail
                ? "Guardar"
                : "Editar"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* contrasñea */}

        <View style={styles.settingCard}>
          <View style={styles.settingIcon}>
            <Ionicons
              name="lock-closed-outline"
              size={22}
              color="#FF555A"
            />
          </View>

          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>
              Contraseña
            </Text>

            {editingPassword ? (
              <TextInput
                style={styles.editInput}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoFocus
                placeholder="Nueva contraseña"
              />
            ) : (
              <Text style={styles.settingValue}>
                ••••••••
              </Text>
            )}
          </View>

          <TouchableOpacity
            onPress={
              editingPassword
                ? savePassword
                : () =>
                    setEditingPassword(true)
            }
            disabled={saving}
          >
            <Text style={styles.editText}>
              {editingPassword
                ? "Guardar"
                : "Cambiar"}
            </Text>
          </TouchableOpacity>
        </View>

        

        {/* favs */}

        <Text style={styles.sectionTitle}>
          Mis favoritos
        </Text>

        {favorites.length === 0 ? (
          <View style={styles.emptyFavorites}>
            <Ionicons
              name="heart-outline"
              size={45}
              color="#FF555A"
            />

            <Text style={styles.emptyTitle}>
              Todavía no tenés favoritos
            </Text>

            <Text style={styles.emptyText}>
              Tocá el corazón de un trago para guardarlo.
            </Text>
          </View>
        ) : (
          favorites.map((cocktail) => (
            <TouchableOpacity
              key={cocktail.id}
              style={styles.favoriteCard}
              onPress={() =>
                onSelectCocktail(cocktail)
              }
            >
              {cocktail.image_url ? (
                <Image
                  source={{
                    uri: cocktail.image_url,
                  }}
                  style={styles.favoriteImage}
                  resizeMode="cover"
                />
              ) : (
                <View
                  style={
                    styles.favoritePlaceholder
                  }
                >
                  <Ionicons
                    name="wine-outline"
                    size={30}
                    color="#FF555A"
                  />
                </View>
              )}

              <View style={styles.favoriteInfo}>
                <Text style={styles.favoriteName}>
                  {cocktail.name}
                </Text>

                <Text
                  style={styles.favoriteDescription}
                  numberOfLines={2}
                >
                  {cocktail.description}
                </Text>

                <View style={styles.favoriteTime}>
                  <Ionicons
                    name="timer-outline"
                    size={16}
                    color="#FF555A"
                  />

                  <Text
                    style={styles.favoriteTimeText}
                  >
                    {cocktail.preparation_time} min
                  </Text>
                </View>
              </View>

              <Ionicons
                name="heart"
                size={22}
                color="#FF555A"
              />
            </TouchableOpacity>
          ))
        )}

        {/* cerrar sesion */}

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={onLogout}
        >
          <Ionicons
            name="log-out-outline"
            size={22}
            color="#FF555A"
          />

          <Text style={styles.logoutText}>
            Cerrar sesión
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function NavItem({ icon, label, onPress }) {
  return (
    <TouchableOpacity
      style={styles.navItem}
      onPress={onPress}
    >
      <Ionicons
        name={icon}
        size={25}
        color="#FF555A"
      />

      <Text style={styles.navLabel}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFDDE0",
  },

  loadingContainer: {
    flex: 1,
    backgroundColor: "#FFDDE0",
    justifyContent: "center",
    alignItems: "center",
  },

  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: "700",
    color: "#555",
  },

  header: {
    height: 80,
    backgroundColor: "#E84A50",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 22,
    paddingTop: 15,
  },

  backButton: {
    width: 28,
  },

  headerTitle: {
    color: "white",
    fontSize: 24,
    fontWeight: "900",
  },

  content: {
    padding: 22,
    paddingBottom: 50,
  },
  navItem: {
  flex: 1,
  alignItems: "center",
  justifyContent: "center",
    },

    navLabel: {
  marginTop: 3,
  fontSize: 11,
  fontWeight: "800",
  color: "#555",
    },
  profileTop: {
    alignItems: "center",
    marginTop: 10,
    marginBottom: 25,
  },

  avatarContainer: {
    width: 125,
    height: 125,
    borderRadius: 63,
    position: "relative",
  },

  avatar: {
    width: "100%",
    height: "100%",
    borderRadius: 63,
  },

  avatarPlaceholder: {
    width: "100%",
    height: "100%",
    borderRadius: 63,
    backgroundColor: "#F4BFC5",
    justifyContent: "center",
    alignItems: "center",
  },

  cameraButton: {
    position: "absolute",
    right: 0,
    bottom: 3,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#E84A50",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#FFDDE0",
  },

  profileName: {
    marginTop: 12,
    fontSize: 27,
    fontWeight: "900",
    color: "#111",
  },

  profileEmail: {
    marginTop: 3,
    fontSize: 14,
    color: "#777",
    fontWeight: "600",
  },

  stats: {
    backgroundColor: "rgba(255,255,255,0.7)",
    borderRadius: 22,
    paddingVertical: 18,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 25,
  },

  stat: {
    flex: 1,
    alignItems: "center",
  },

  statNumber: {
    fontSize: 27,
    fontWeight: "900",
    color: "#FF555A",
  },

  statLabel: {
    marginTop: 3,
    fontSize: 13,
    fontWeight: "800",
    color: "#555",
  },

  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: "#DDD",
  },

  sectionTitle: {
    fontSize: 23,
    fontWeight: "900",
    color: "#111",
    marginBottom: 12,
    marginTop: 5,
  },

  settingCard: {
    backgroundColor: "white",
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
  },

  photoSetting: {
    backgroundColor: "white",
    borderRadius: 18,
    padding: 14,
    marginBottom: 25,
    flexDirection: "row",
    alignItems: "center",
  },

  settingIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#FFECEF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  settingInfo: {
    flex: 1,
  },

  settingTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#222",
  },

  settingValue: {
    marginTop: 3,
    fontSize: 14,
    color: "#777",
    fontWeight: "600",
  },

  editInput: {
    marginTop: 4,
    fontSize: 14,
    color: "#111",
    fontWeight: "700",
    paddingVertical: 3,
    borderBottomWidth: 1,
    borderBottomColor: "#FF555A",
  },

  editText: {
    color: "#FF555A",
    fontSize: 14,
    fontWeight: "900",
  },

  emptyFavorites: {
    backgroundColor: "rgba(255,255,255,0.6)",
    borderRadius: 20,
    padding: 25,
    alignItems: "center",
    marginBottom: 25,
  },

  emptyTitle: {
    marginTop: 10,
    fontSize: 17,
    fontWeight: "900",
    color: "#222",
  },

  emptyText: {
    marginTop: 5,
    fontSize: 14,
    color: "#777",
    textAlign: "center",
    lineHeight: 20,
  },

  favoriteCard: {
    backgroundColor: "white",
    borderRadius: 18,
    padding: 10,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
  },

  favoriteImage: {
    width: 85,
    height: 85,
    borderRadius: 14,
  },

  favoritePlaceholder: {
    width: 85,
    height: 85,
    borderRadius: 14,
    backgroundColor: "#F4BFC5",
    justifyContent: "center",
    alignItems: "center",
  },

  favoriteInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },

  favoriteName: {
    fontSize: 17,
    fontWeight: "900",
    color: "#111",
  },

  favoriteDescription: {
    marginTop: 3,
    fontSize: 13,
    color: "#666",
    lineHeight: 18,
  },

  favoriteTime: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
    gap: 4,
  },

  favoriteTimeText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#FF555A",
  },

  logoutButton: {
    height: 55,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: "#FF555A",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: 5,
  },

  logoutText: {
    color: "#FF555A",
    fontSize: 16,
    fontWeight: "900",
  },
});