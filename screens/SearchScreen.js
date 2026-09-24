import React, { useEffect, useState } from "react";

import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../services/supabase";

export default function SearchScreen({
  initialSearch = "",
  onBack,
  onSelectCocktail,
}) {
  const [search, setSearch] = useState(initialSearch);
  const [cocktails, setCocktails] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setSearch(initialSearch);
  }, [initialSearch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      searchCocktails(search);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  const searchCocktails = async (text) => {
    setLoading(true);

    try {
      const searchText = text.trim().toLowerCase();

      const { data: cocktailsData, error: cocktailsError } =
        await supabase
          .from("cocktails")
          .select("*")
          .order("created_at", {
            ascending: false,
          });

      if (cocktailsError) {
        console.log(
          "Error cargando cocktails:",
          cocktailsError
        );

        setCocktails([]);
        return;
      }

      if (!searchText) {
        setCocktails(cocktailsData || []);
        return;
      }

      const { data: ingredientsData, error: ingredientsError } =
        await supabase
          .from("cocktail_ingredients")
          .select(`
            cocktail_id,
            ingredients (
              name
            )
          `);

      if (ingredientsError) {
        console.log(
          "Error cargando ingredientes:",
          ingredientsError
        );
      }

      const { data: categoriesData, error: categoriesError } =
        await supabase
          .from("cocktail_categories")
          .select(`
            cocktail_id,
            categories (
              name
            )
          `);

      if (categoriesError) {
        console.log(
          "Error cargando categorías:",
          categoriesError
        );
      }

      const filteredCocktails =
        (cocktailsData || []).filter((cocktail) => {
          const name =
            cocktail.name?.toLowerCase() || "";

          const description =
            cocktail.description?.toLowerCase() || "";

          const nameMatch =
            name.includes(searchText);

          const descriptionMatch =
            description.includes(searchText);

          const ingredientMatch =
            (ingredientsData || []).some(
              (item) =>
                item.cocktail_id === cocktail.id &&
                item.ingredients?.name
                  ?.toLowerCase()
                  .includes(searchText)
            );

          const categoryMatch =
            (categoriesData || []).some(
              (item) =>
                item.cocktail_id === cocktail.id &&
                item.categories?.name
                  ?.toLowerCase()
                  .includes(searchText)
            );

          return (
            nameMatch ||
            descriptionMatch ||
            ingredientMatch ||
            categoryMatch
          );
        });

      setCocktails(filteredCocktails);
    } catch (error) {
      console.log(
        "Error buscando cocktails:",
        error
      );

      setCocktails([]);
    } finally {
      setLoading(false);
    }
  };

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
          Buscar
        </Text>

        <View style={{ width: 28 }} />
      </View>

      <View style={styles.searchContainer}>
        <Ionicons
          name="search-outline"
          size={25}
          color="#999"
        />

        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Nombre, ingrediente o etiqueta..."
          placeholderTextColor="#999"
          style={styles.searchInput}
          autoFocus
        />

        {search.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearch("")}
          >
            <Ionicons
              name="close-circle"
              size={23}
              color="#999"
            />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator
              size="large"
              color="#FF555A"
            />

            <Text style={styles.loadingText}>
              Buscando...
            </Text>
          </View>
        ) : cocktails.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons
              name="search-outline"
              size={55}
              color="#FF555A"
            />

            <Text style={styles.emptyTitle}>
              No encontramos tragos
            </Text>

            <Text style={styles.emptyText}>
              Probá buscando por nombre, ingrediente
              o etiqueta.
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.resultsText}>
              {cocktails.length}{" "}
              {cocktails.length === 1
                ? "trago encontrado"
                : "tragos encontrados"}
            </Text>

            {cocktails.map((cocktail) => (
              <TouchableOpacity
                key={cocktail.id}
                style={styles.cocktailCard}
                onPress={() =>
                  onSelectCocktail(cocktail)
                }
                activeOpacity={0.8}
              >
                {cocktail.image_url ? (
                  <Image
                    source={{
                      uri: cocktail.image_url,
                    }}
                    style={styles.cocktailImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Ionicons
                      name="wine-outline"
                      size={38}
                      color="#FF555A"
                    />
                  </View>
                )}

                <View style={styles.cocktailInfo}>
                  <Text style={styles.cocktailName}>
                    {cocktail.name}
                  </Text>

                  <Text
                    style={styles.description}
                    numberOfLines={2}
                  >
                    {cocktail.description}
                  </Text>

                  <View style={styles.time}>
                    <Ionicons
                      name="timer-outline"
                      size={17}
                      color="#FF555A"
                    />

                    <Text style={styles.timeText}>
                      {cocktail.preparation_time} min
                    </Text>
                  </View>
                </View>

                <Ionicons
                  name="chevron-forward"
                  size={22}
                  color="#999"
                />
              </TouchableOpacity>
            ))}
          </>
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

  backButton: {
    width: 28,
  },

  headerTitle: {
    color: "white",
    fontSize: 24,
    fontWeight: "900",
  },

  searchContainer: {
    height: 52,
    backgroundColor: "white",
    borderRadius: 28,
    marginHorizontal: 22,
    marginTop: 18,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    boxShadow:
      "0px 3px 6px rgba(0, 0, 0, 0.12)",
  },

  searchInput: {
    flex: 1,
    marginLeft: 9,
    marginRight: 8,
    fontSize: 15,
    fontWeight: "600",
    color: "#111",
  },

  content: {
    padding: 22,
    paddingTop: 18,
    paddingBottom: 40,
  },

  resultsText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#555",
    marginBottom: 12,
  },

  cocktailCard: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 10,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    boxShadow:
      "0px 3px 6px rgba(0, 0, 0, 0.12)",
  },

  cocktailImage: {
    width: 90,
    height: 90,
    borderRadius: 15,
  },

  imagePlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 15,
    backgroundColor: "#F4BFC5",
    justifyContent: "center",
    alignItems: "center",
  },

  cocktailInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },

  cocktailName: {
    fontSize: 18,
    fontWeight: "900",
    color: "#111",
  },

  description: {
    marginTop: 3,
    fontSize: 13,
    lineHeight: 18,
    color: "#666",
  },

  time: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
    gap: 4,
  },

  timeText: {
    color: "#FF555A",
    fontSize: 12,
    fontWeight: "800",
  },

  loadingContainer: {
    alignItems: "center",
    paddingTop: 50,
  },

  loadingText: {
    marginTop: 10,
    color: "#777",
    fontSize: 15,
    fontWeight: "700",
  },

  emptyContainer: {
    alignItems: "center",
    paddingHorizontal: 25,
    paddingTop: 60,
  },

  emptyTitle: {
    marginTop: 15,
    fontSize: 20,
    fontWeight: "900",
    color: "#222",
  },

  emptyText: {
    marginTop: 7,
    fontSize: 14,
    lineHeight: 21,
    color: "#777",
    textAlign: "center",
  },
});