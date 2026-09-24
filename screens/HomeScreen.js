import React, { useEffect, useState } from "react";

import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  StatusBar,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { supabase } from "../services/supabase";

export default function HomeScreen({
  session,
  onSelectCocktail,
  onOpenCommunity,
  onOpenProfile,
  onSearch,
}) {
  const [profile, setProfile] = useState(null);
  const [cocktail, setCocktail] = useState(null);

  // Cargar perfil del usuario
  useEffect(() => {
    const loadProfile = async () => {
      if (!session?.user?.id) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("username, avatar_url")
        .eq("id", session.user.id)
        .maybeSingle();

      if (error) {
        console.log(
          "Error cargando perfil del menú:",
          error
        );
        return;
      }

      setProfile(data);
    };

    loadProfile();
  }, [session]);

  // Cargar trago recomendado del día
  useEffect(() => {
    const getDailyCocktail = async () => {
      const { data, error } = await supabase
        .from("cocktails")
        .select("*");

      if (error) {
        console.log(
          "Error cargando trago del día:",
          error
        );
        return;
      }

      if (!data || data.length === 0) {
        return;
      }

      const today = new Date();

      const dateSeed =
        today.getFullYear() * 10000 +
        (today.getMonth() + 1) * 100 +
        today.getDate();

      const index = dateSeed % data.length;

      setCocktail(data[index]);
    };

    getDailyCocktail();
  }, []);

  return (
    <LinearGradient
      colors={["#FFFFFF", "#FFDDE0", "#FFB5C2"]}
      style={styles.content}
    >
      <StatusBar
        barStyle="light-content"
        backgroundColor="#FF555A"
      />

      {/* header */}

      <LinearGradient
        colors={[
          "#E84A50",
          "#FF777B",
          "#B9151B",
        ]}
        style={styles.header}
      >
        <View style={styles.logoContainer}>
          <Image
            source={require("../assets/logo.png")}
            style={styles.logoIcon}
          />

          <Text style={styles.logo}>
            CALTRAGO
          </Text>
        </View>

        {/* buscar */}

        <View style={styles.searchContainer}>
          <Ionicons
            name="search-outline"
            size={26}
            color="#BDBDBD"
          />

          <TextInput
            style={styles.searchInput}
            placeholder="Ingresá ingredientes o nombre..."
            placeholderTextColor="#999"
            onFocus={() => onSearch("")}
          />
        </View>
      </LinearGradient>

      {/* contenido */}

      <View style={styles.mainContent}>
        <Text style={styles.sectionTitle}>
          Elige como lo quieres
        </Text>

        <View style={styles.row}>
          <CategoryButton
            text="Con Alcohol"
            onPress={() => onSearch("Con Alcohol")}
          />
          <CategoryButton
            text="Sin Alcohol"
            onPress={() => onSearch("Sin Alcohol")}
          />
        </View>

        <View style={styles.row}>
          <CategoryButton
            text="Refrescante"
            onPress={() => onSearch("Refrescante")}
          />
          <CategoryButton
            text="Clásicos"
            onPress={() => onSearch("Clásicos")}
          />
        </View>

        <View style={styles.row}>
          <CategoryButton
            text="Tropicales"
            onPress={() => onSearch("Tropicales")}
          />
          <CategoryButton
            text="Shots"
            onPress={() => onSearch("Shots")}
          />
        </View>

        {/* trago recomendado */}

        <Text style={styles.sectionTitle}>
          Trago recomendado del día
        </Text>

        <TouchableOpacity
          style={styles.card}
          onPress={() => {
            if (cocktail) {
              onSelectCocktail(cocktail);
            }
          }}
          disabled={!cocktail}
        >
          <View style={styles.fakeCocktail}>
            {cocktail?.image_url ? (
              <Image
                source={{
                  uri: cocktail.image_url,
                }}
                style={styles.cocktailImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Text style={styles.cocktailEmoji}>
                  🍹
                </Text>
              </View>
            )}
          </View>

          <View style={styles.cardInfo}>
            <Text style={styles.cocktailName}>
              {cocktail
                ? cocktail.name
                : "Cargando..."}
            </Text>

            <View style={styles.line} />

            <View style={styles.time}>
              <Text>
                Tiempo prep.
              </Text>

              <Ionicons
                name="timer-outline"
                size={24}
              />

              <Text style={styles.timeBold}>
                {cocktail
                  ? `${cocktail.preparation_time} min`
                  : "--"}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>

     
      {/* nav */}

      <View style={styles.navbar}>
        <NavItem
          icon="home"
          label="Inicio"
        />

        <NavItem
          icon="search-outline"
          label="Buscar"
          onPress={() => onSearch("")}
        />

        <NavItem
          icon="people-outline"
          label="Comunidad"
          onPress={onOpenCommunity}
        />

        <NavItem
          icon="person-outline"
          label="Perfil"
          onPress={onOpenProfile}
        />
      </View>
    </LinearGradient>
  );
}

/* categorias */

function CategoryButton({ text, onPress }) {
  return (
    <TouchableOpacity
      style={styles.categoryButton}
      onPress={onPress}
    >
      <Text style={styles.categoryText}>
        {text}
      </Text>
    </TouchableOpacity>
  );
}

/* nav */

function NavItem({
  icon,
  label,
  onPress,
}) {
  return (
    <TouchableOpacity
      style={styles.navItem}
      onPress={onPress}
    >
      <Ionicons
        name={icon}
        size={22}
        color="white"
      />

      <Text style={styles.navText}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

/* estilos (matenme otra ve) */

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },

  /* header */

  header: {
    backgroundColor: "#FF555A",
    paddingHorizontal: 30,
    paddingTop: 15,
    paddingBottom: 30,
  },

  logoContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 18,
  },

  logoIcon: {
    width: 38,
    height: 38,
    marginRight: 5,
  },

  logo: {
    color: "white",
    fontSize: 36,
    fontWeight: "900",
  },

  searchContainer: {
    height: 50,
    backgroundColor: "white",
    borderRadius: 30,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
  },

  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    fontWeight: "600",
  },

  /* contenido */

  mainContent: {
    flex: 1,
    paddingHorizontal: 22,
    paddingTop: 22,
    backgroundColor: "#FFDDE0",
  },

  sectionTitle: {
    color: "#111",
    fontSize: 27,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 20,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 17,
  },

  categoryButton: {
    backgroundColor:
      "rgba(255, 255, 255, 0.75)",
    width: "47%",
    height: 58,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor:
      "rgba(255, 255, 255, 0.9)",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 4,
  },

  categoryText: {
    color: "#111",
    fontSize: 16,
    fontWeight: "800",
  },

  /* trao reocomendado */

  card: {
    height: 148,
    backgroundColor:
      "rgba(255, 220, 225, 0.85)",
    borderRadius: 25,
    padding: 10,
    flexDirection: "row",
    borderWidth: 1,
    borderColor:
      "rgba(255, 255, 255, 0.8)",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 7,
    elevation: 5,
  },

  fakeCocktail: {
    width: 125,
    height: 128,
    borderRadius: 18,
    backgroundColor: "#F4BFC5",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },

  cocktailImage: {
    width: "100%",
    height: "100%",
  },

  imagePlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#F4BFC5",
    justifyContent: "center",
    alignItems: "center",
  },

  cocktailEmoji: {
    fontSize: 45,
  },

  cardInfo: {
    flex: 1,
    alignItems: "center",
    paddingTop: 12,
  },

  cocktailName: {
    fontSize: 22,
    fontWeight: "900",
    color: "#111",
    textAlign: "center",
  },

  line: {
    width: 135,
    height: 1,
    backgroundColor: "#111",
    marginTop: 3,
    marginBottom: 27,
  },

  time: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 10,
  },

  timeBold: {
    fontWeight: "900",
    color: "#111",
  },

  /* Mneu flotante */

  profileFloating: {
    position: "absolute",
    right: 12,
    bottom: 85,
    minWidth: 190,
    maxWidth: 245,
    height: 66,
    backgroundColor: "white",
    borderRadius: 35,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 9,
    paddingRight: 15,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 16,
  },

  profileAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },

  profileAvatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FFECEF",
    justifyContent: "center",
    alignItems: "center",
  },

  profileInfo: {
    flex: 1,
    marginLeft: 10,
    marginRight: 8,
  },

  profileName: {
    color: "#111",
    fontSize: 15,
    fontWeight: "900",
  },

  profileSubtitle: {
    color: "#888",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },

  /* nav bar */

  navbar: {
    height: 70,
    backgroundColor: "#C91E25",
    borderTopWidth: 2,
    borderTopColor:
      "rgba(255, 255, 255, 0.5)",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingBottom: 4,
  },

  navItem: {
    alignItems: "center",
    justifyContent: "center",
    width: "25%",
  },

  navText: {
    color: "white",
    fontSize: 14,
    fontWeight: "800",
    marginTop: 3,
  },
});