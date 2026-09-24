import React, { useEffect, useState } from "react";

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";

import { supabase } from "../services/supabase";

export default function CommunityScreen({
  onBack,
  onSelectCocktail,
  onCreateCocktail,
}) {
  const [cocktails, setCocktails] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getCocktails = async () => {
      const { data, error } = await supabase
        .from("cocktails")
        .select("*")
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        console.log(
          "Error cargando bebidas:",
          error
        );
        setLoading(false);
        return;
      }

      setCocktails(data || []);
      setLoading(false);
    };

    getCocktails();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Ionicons
            name="arrow-back"
            size={28}
            color="white"
          />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          Comunidad
        </Text>

        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>
          Bebidas de la comunidad
        </Text>
        <TouchableOpacity
            style={styles.addButton}
            onPress={onCreateCocktail}
            >
            <Ionicons
                name="add-circle-outline"
                size={22}
                color="white"
            />

            <Text style={styles.addButtonText}>
                Aportar bebida
            </Text>
        </TouchableOpacity>
        {loading ? (
          <Text style={styles.message}>
            Cargando bebidas...
          </Text>
        ) : cocktails.length === 0 ? (
          <Text style={styles.message}>
            Todavía no hay bebidas publicadas.
          </Text>
        ) : (
          cocktails.map((cocktail) => (
            <TouchableOpacity
              key={cocktail.id}
              style={styles.card}
              onPress={() =>
                onSelectCocktail(cocktail)
              }
            >
              {cocktail.image_url ? (
                <Image
                  source={{
                    uri: cocktail.image_url,
                  }}
                  style={styles.image}
                />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Ionicons
                    name="wine-outline"
                    size={40}
                    color="#FF555A"
                  />
                </View>
              )}

              <View style={styles.info}>
                <Text style={styles.name}>
                  {cocktail.name}
                </Text>

                <Text
                  style={styles.description}
                  numberOfLines={2}
                >
                  {cocktail.description}
                </Text>

                <View style={styles.bottom}>
                  <View style={styles.time}>
                    <Ionicons
                      name="timer-outline"
                      size={18}
                      color="#FF555A"
                    />

                    <Text style={styles.timeText}>
                      {cocktail.preparation_time} min
                    </Text>
                  </View>

                  <Text style={styles.user}>
                    Comunidad
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFDDE0",
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

  headerTitle: {
    color: "white",
    fontSize: 24,
    fontWeight: "900",
  },

  content: {
    padding: 22,
    paddingBottom: 40,
  },

  title: {
    fontSize: 28,
    fontWeight: "900",
    color: "#111",
    textAlign: "center",
    marginBottom: 20,
  },

  message: {
    textAlign: "center",
    color: "#666",
    fontSize: 16,
    marginTop: 30,
  },

  card: {
    backgroundColor: "rgba(255,255,255,0.75)",
    borderRadius: 22,
    padding: 10,
    marginBottom: 15,
    flexDirection: "row",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.12,
    shadowRadius: 5,
    elevation: 4,
  },

  image: {
    width: 110,
    height: 110,
    borderRadius: 17,
    resizeMode: "cover",
  },

  imagePlaceholder: {
    width: 110,
    height: 110,
    borderRadius: 17,
    backgroundColor: "#F4BFC5",
    justifyContent: "center",
    alignItems: "center",
  },

  info: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },

  name: {
    fontSize: 21,
    fontWeight: "900",
    color: "#111",
  },

  description: {
    color: "#555",
    fontSize: 14,
    marginTop: 5,
    lineHeight: 19,
  },

  bottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },

  time: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  timeText: {
    color: "#FF555A",
    fontWeight: "800",
    fontSize: 13,
  },

  user: {
    color: "#888",
    fontSize: 12,
    fontWeight: "700",
  },
  addButton: {
  height: 50,
  backgroundColor: "#111",
  borderRadius: 25,
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  marginBottom: 22,
    },

addButtonText: {
  color: "white",
  fontSize: 16,
  fontWeight: "900",
    },
});