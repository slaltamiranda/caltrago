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

export default function CocktailScreen({ cocktail, onBack }) {
  const [ingredients, setIngredients] = useState([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const getIngredients = async () => {
      const { data, error } = await supabase
        .from("cocktail_ingredients")
        .select(`
          amount,
          ingredients (
            name
          )
        `)
        .eq("cocktail_id", cocktail.id);

      if (error) {
        console.log(
          "Error cargando ingredientes:",
          error
        );
        return;
      }

      setIngredients(data || []);
    };

    if (cocktail) {
      getIngredients();
    }
  }, [cocktail]);
  useEffect(() => {
  const getCategories = async () => {
    const { data, error } = await supabase
      .from("cocktail_categories")
      .select(`
        categories (
          name
        )
      `)
      .eq("cocktail_id", cocktail.id);

    if (error) {
      console.log(
        "Error cargando categorías:",
        error
      );
      return;
    }

    setCategories(data || []);
  };

  if (cocktail) {
    getCategories();
  }
  }, [cocktail]);
  useEffect(() => {
    const checkFavorite = async () => {
      if (!cocktail) return;

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data, error } = await supabase
        .from("favorites")
        .select("cocktail_id")
        .eq("user_id", user.id)
        .eq("cocktail_id", cocktail.id)
        .maybeSingle();

      if (error) {
        console.log(
          "Error comprobando favorito:",
          error
        );
        return;
      }

      setIsFavorite(!!data);
    };

    checkFavorite();
  }, [cocktail]);

  const toggleFavorite = async () => {
    if (favoriteLoading) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.log(
        "No hay usuario autenticado."
      );
      return;
    }

    setFavoriteLoading(true);

    if (isFavorite) {
      const { error } = await supabase
        .from("favorites")
        .delete()
        .eq("user_id", user.id)
        .eq("cocktail_id", cocktail.id);

      if (error) {
        console.log(
          "Error eliminando favorito:",
          error
        );
      } else {
        setIsFavorite(false);
      }
    } else {
      const { error } = await supabase
        .from("favorites")
        .insert({
          user_id: user.id,
          cocktail_id: cocktail.id,
        });

      if (error) {
        console.log(
          "Error agregando favorito:",
          error
        );
      } else {
        setIsFavorite(true);
      }
    }

    setFavoriteLoading(false);
  };

  if (!cocktail) return null;

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
          Trago
        </Text>

        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {cocktail.image_url ? (
          <Image
            source={{ uri: cocktail.image_url }}
            style={styles.cocktailImage}
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.placeholderText}>
              Sin imagen
            </Text>
          </View>
        )}

        <View style={styles.titleRow}>
          <Text style={styles.title}>
            {cocktail.name}
          </Text>

          <TouchableOpacity
            style={[
              styles.favoriteButton,
              isFavorite &&
                styles.favoriteButtonActive,
            ]}
            onPress={toggleFavorite}
            disabled={favoriteLoading}
            activeOpacity={0.7}
          >
            <Ionicons
              name={
                isFavorite
                  ? "heart"
                  : "heart-outline"
              }
              size={30}
              color={
                isFavorite
                  ? "white"
                  : "#FF555A"
              }
            />
          </TouchableOpacity>
        </View>

        <View style={styles.time}>
          <Ionicons
            name="timer-outline"
            size={24}
            color="#FF555A"
          />

          <Text style={styles.timeText}>
            {cocktail.preparation_time} min
          </Text>
        </View>
        {categories.length > 0 && (
          <View style={styles.categoriesContainer}>
            {categories.map((item, index) => (
              <View
                key={index}
                style={styles.categoryTag}
              >
                <Text style={styles.categoryTagText}>
                  {item.categories?.name}
                </Text>
              </View>
            ))}
          </View>
        )}
        <Text style={styles.sectionTitle}>
          Descripción
        </Text>

        <Text style={styles.description}>
          {cocktail.description}
        </Text>

        <Text style={styles.sectionTitle}>
          Ingredientes
        </Text>

        <View style={styles.ingredientsContainer}>
          {ingredients.map((item, index) => (
            <View
              key={index}
              style={styles.ingredientRow}
            >
              <View style={styles.ingredientDot} />

              <Text style={styles.amount}>
                {item.amount}
              </Text>

              <Text style={styles.ingredientName}>
                {item.ingredients?.name}
              </Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>
          Preparación
        </Text>

        <Text style={styles.description}>
          {cocktail.preparation}
        </Text>
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

  cocktailImage: {
    width: "100%",
    height: 230,
    borderRadius: 25,
    resizeMode: "cover",
    marginBottom: 20,
  },

  imagePlaceholder: {
    height: 230,
    backgroundColor: "#F4BFC5",
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },

  placeholderText: {
    color: "#777",
    fontSize: 16,
    fontWeight: "700",
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },

  title: {
    flex: 1,
    fontSize: 34,
    fontWeight: "900",
    color: "#111",
    textAlign: "center",
  },

  favoriteButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 4,
  },

  favoriteButtonActive: {
    backgroundColor: "#FF555A",
  },

  time: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    marginBottom: 25,
    gap: 6,
  },

  timeText: {
    fontSize: 17,
    fontWeight: "800",
    color: "#FF555A",
  },

  sectionTitle: {
    fontSize: 23,
    fontWeight: "900",
    color: "#111",
    marginTop: 15,
    marginBottom: 10,
  },

  description: {
    fontSize: 16,
    lineHeight: 24,
    color: "#333",
  },

  ingredientsContainer: {
    backgroundColor: "rgba(255,255,255,0.65)",
    borderRadius: 18,
    padding: 15,
  },

  ingredientRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 9,
  },

  ingredientDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FF555A",
    marginRight: 10,
  },

  amount: {
    width: 105,
    fontSize: 15,
    fontWeight: "800",
    color: "#555",
  },

  ingredientName: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
  },
  categoriesContainer: {
  flexDirection: "row",
  flexWrap: "wrap",
  justifyContent: "center",
  gap: 8,
  marginBottom: 15,
  },

  categoryTag: {
  backgroundColor: "#FF555A",
  paddingHorizontal: 14,
  paddingVertical: 7,
  borderRadius: 20,
  },

  categoryTagText: {
  color: "white",
  fontSize: 13,
  fontWeight: "900",
  },
});