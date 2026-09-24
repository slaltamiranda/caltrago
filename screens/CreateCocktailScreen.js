import React, { useEffect, useState } from "react";

import {
  View,
  Text,
  StyleSheet,
  TextInput,    
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
} from "react-native";

import * as ImagePicker from "expo-image-picker";
import { File } from "expo-file-system";
import { Ionicons } from "@expo/vector-icons";

import { supabase } from "../services/supabase";

export default function CreateCocktailScreen({
  session,
  onBack,
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [preparationTime, setPreparationTime] = useState("");
  const [preparation, setPreparation] = useState("");
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [image, setImage] = useState(null);
  const [ingredients, setIngredients] = useState([
    {
      name: "",
      amount: "",
    },
  ]);

  const [loading, setLoading] = useState(false);
  useEffect(() => {
  const getCategories = async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("id, name")
      .order("id", {
        ascending: true,
      });

    if (error) {
      console.log(
        "Error cargando categorías:",
        error
      );
      return;
    }

    setCategories(data || []);
  };

  getCategories();
  }, []);
  const pickImage = async () => {
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
        aspect: [4, 3],
        quality: 0.8,
        base64: false,
    });

    if (result.canceled) {
      return;
    }

    const asset = result.assets[0];

    setImage({
    uri: asset.uri,
    mimeType:
        asset.mimeType || "image/jpeg",
    fileName:
        asset.fileName ||
        `cocktail-${Date.now()}.jpg`,
    });
  };
  const toggleCategory = (categoryId) => {
  setSelectedCategories((current) => {
    if (current.includes(categoryId)) {
      return current.filter(
        (id) => id !== categoryId
      );
    }

    return [...current, categoryId];
  });
  };
  const addIngredient = () => {
    setIngredients([
      ...ingredients,
      {
        name: "",
        amount: "",
      },
    ]);
  };

  const updateIngredient = (
    index,
    field,
    value
  ) => {
    const updated = [...ingredients];

    updated[index][field] = value;

    setIngredients(updated);
  };

  const removeIngredient = (index) => {
    if (ingredients.length === 1) {
      return;
    }

    setIngredients(
      ingredients.filter(
        (_, ingredientIndex) =>
          ingredientIndex !== index
      )
    );
  };

  const publishCocktail = async () => {
    if (
      !name.trim() ||
      !description.trim() ||
      !preparationTime.trim() ||
      !preparation.trim()
    ) {
      Alert.alert(
        "Caltrago",
        "Completá todos los campos."
      );
      return;
    }

    const validIngredients =
      ingredients.filter(
        (ingredient) =>
          ingredient.name.trim() &&
          ingredient.amount.trim()
      );

    if (validIngredients.length === 0) {
      Alert.alert(
        "Caltrago",
        "Agregá al menos un ingrediente."
      );
      return;
    }

    if (!session?.user?.id) {
      Alert.alert(
        "Error",
        "No se encontró tu usuario."
      );
      return;
    }

    setLoading(true);

    try {
      let imageUrl = null;

      // subir imagen

      if (image?.uri) {
        const file = new File(image.uri);

        if (!file.exists) {
            throw new Error(
            "No se encontró el archivo de imagen."
            );
        }

        const arrayBuffer =
            await file.arrayBuffer();

        const extension =
            image.fileName
            ?.split(".")
            .pop() || "jpg";

        const fileName =
            `${Date.now()}-${Math.random()
            .toString(36)
            .substring(2, 9)}.${extension}`;

        const { error: uploadError } =
            await supabase.storage
            .from("cocktail-images")
            .upload(
                fileName,
                arrayBuffer,
                {
                contentType:
                    image.mimeType ||
                    "image/jpeg",
                upsert: false,
                }
            );

        if (uploadError) {
            console.log(
            "Error subiendo imagen:",
            uploadError
            );

            Alert.alert(
            "Error al subir imagen",
            uploadError.message
            );

            return;
        }

        const { data: publicUrlData } =
            supabase.storage
            .from("cocktail-images")
            .getPublicUrl(fileName);

        imageUrl =
            publicUrlData.publicUrl;
        }

      // crear bedbida

      const {
        data: cocktail,
        error: cocktailError,
      } = await supabase
        .from("cocktails")
        .insert({
          name: name.trim(),
          description: description.trim(),
          preparation: preparation.trim(),
          preparation_time: Number(
            preparationTime
          ),
          image_url: imageUrl,
          created_by: session.user.id,
        })
        .select()
        .single();

      if (cocktailError) {
        console.log(
          "Error creando bebida:",
          cocktailError
        );

        Alert.alert(
          "Error",
          cocktailError.message
        );

        return;
      }

      // ingredientes

      for (const ingredient of validIngredients) {
        const cleanName =
          ingredient.name.trim();

        const cleanAmount =
          ingredient.amount.trim();

        const {
          data: existingIngredient,
          error: findError,
        } = await supabase
          .from("ingredients")
          .select("id")
          .eq("name", cleanName)
          .maybeSingle();

        if (findError) {
          console.log(
            "Error buscando ingrediente:",
            findError
          );
          continue;
        }

        let ingredientId =
          existingIngredient?.id;

        if (!ingredientId) {
          const {
            data: newIngredient,
            error: createError,
          } = await supabase
            .from("ingredients")
            .insert({
              name: cleanName,
            })
            .select()
            .single();

          if (createError) {
            console.log(
              "Error creando ingrediente:",
              createError
            );
            continue;
          }

          ingredientId =
            newIngredient.id;
        }

        const {
          error: relationError,
        } = await supabase
          .from("cocktail_ingredients")
          .insert({
            cocktail_id: cocktail.id,
            ingredient_id: ingredientId,
            amount: cleanAmount,
          });

        if (relationError) {
          console.log(
            "Error relacionando ingrediente:",
            relationError
          );
        }
      }
      // categorías

      for (const categoryId of selectedCategories) {
        const { error: categoryError } =
          await supabase
            .from("cocktail_categories")
            .insert({
              cocktail_id: cocktail.id,
              category_id: categoryId,
            });

        if (categoryError) {
          console.log(
            "Error relacionando categoría:",
            categoryError
          );
        }
      }
      Alert.alert(
        "¡Listo!",
        "La bebida fue publicada correctamente."
      );

      onBack();
    } catch (error) {
      console.log(
        "Error general:",
        error
      );

      Alert.alert(
        "Error",
        error.message ||
          "No se pudo publicar la bebida."
      );
    } finally {
      setLoading(false);
    }
  };

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
          Crear bebida
        </Text>

        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          style={styles.imageButton}
          onPress={pickImage}
        >
          {image?.uri ? (
            <Image
              source={{ uri: image.uri }}
              style={styles.preview}
            />
          ) : (
            <>
              <Ionicons
                name="camera-outline"
                size={42}
                color="#FF555A"
              />

              <Text style={styles.imageText}>
                Agregar imagen
              </Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.label}>
          Nombre
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Ej: Mojito"
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.label}>
          Descripción
        </Text>

        <TextInput
          style={[
            styles.input,
            styles.multiline,
          ]}
          placeholder="Contá un poco sobre el trago..."
          multiline
          value={description}
          onChangeText={setDescription}
        />
        <Text style={styles.label}>
  Etiquetas
</Text>

<View style={styles.categoriesContainer}>
  {categories.map((category) => {
    const selected =
      selectedCategories.includes(
        category.id
      );

    return (
      <TouchableOpacity
        key={category.id}
        style={[
          styles.categoryButton,
          selected &&
            styles.categoryButtonSelected,
        ]}
        onPress={() =>
          toggleCategory(category.id)
        }
        activeOpacity={0.8}
      >
        <Ionicons
          name={
            selected
              ? "checkmark-circle"
              : "ellipse-outline"
          }
          size={19}
          color={
            selected
              ? "white"
              : "#FF555A"
          }
        />

        <Text
          style={[
            styles.categoryButtonText,
            selected &&
              styles.categoryButtonTextSelected,
          ]}
        >
          {category.name}
        </Text>
      </TouchableOpacity>
    );
  })}
  </View>
        <Text style={styles.label}>
          Ingredientes
        </Text>

        {ingredients.map(
          (ingredient, index) => (
            <View
              key={index}
              style={styles.ingredientRow}
            >
              <TextInput
                style={[
                  styles.input,
                  styles.ingredientName,
                ]}
                placeholder="Ingrediente"
                value={ingredient.name}
                onChangeText={(value) =>
                  updateIngredient(
                    index,
                    "name",
                    value
                  )
                }
              />

              <TextInput
                style={[
                  styles.input,
                  styles.ingredientAmount,
                ]}
                placeholder="Cantidad"
                value={ingredient.amount}
                onChangeText={(value) =>
                  updateIngredient(
                    index,
                    "amount",
                    value
                  )
                }
              />

              {ingredients.length > 1 && (
                <TouchableOpacity
                  style={
                    styles.removeButton
                  }
                  onPress={() =>
                    removeIngredient(index)
                  }
                >
                  <Ionicons
                    name="trash-outline"
                    size={21}
                    color="#FF555A"
                  />
                </TouchableOpacity>
              )}
            </View>
          )
        )}

        <TouchableOpacity
          style={
            styles.addIngredientButton
          }
          onPress={addIngredient}
        >
          <Ionicons
            name="add-circle-outline"
            size={21}
            color="#FF555A"
          />

          <Text
            style={
              styles.addIngredientText
            }
          >
            Agregar ingrediente
          </Text>
        </TouchableOpacity>

        <Text style={styles.label}>
          Tiempo de preparación
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Ej: 5"
          keyboardType="numeric"
          value={preparationTime}
          onChangeText={
            setPreparationTime
          }
        />

        <Text style={styles.label}>
          Preparación
        </Text>

        <TextInput
          style={[
            styles.input,
            styles.multiline,
          ]}
          placeholder="Explicá cómo preparar el trago..."
          multiline
          value={preparation}
          onChangeText={setPreparation}
        />

        <Text style={styles.createdBy}>
          Publicado por tu usuario
        </Text>

        <TouchableOpacity
          style={styles.publishButton}
          onPress={publishCocktail}
          disabled={loading}
        >
          <Text style={styles.publishText}>
            {loading
              ? "Publicando..."
              : "PUBLICAR BEBIDA"}
          </Text>
        </TouchableOpacity>
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

  imageButton: {
    height: 210,
    backgroundColor:
      "rgba(255,255,255,0.7)",
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    marginBottom: 25,
    borderWidth: 1,
    borderColor:
      "rgba(255,255,255,0.9)",
  },

  preview: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },

  imageText: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: "800",
    color: "#FF555A",
  },

  label: {
    fontSize: 17,
    fontWeight: "900",
    color: "#111",
    marginBottom: 7,
    marginTop: 8,
  },

  input: {
    backgroundColor: "white",
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 12,
  },

  multiline: {
    minHeight: 110,
    textAlignVertical: "top",
  },

  ingredientRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  ingredientName: {
    flex: 1,
  },

  ingredientAmount: {
    width: 115,
  },

  removeButton: {
    width: 42,
    height: 48,
    borderRadius: 15,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },

  addIngredientButton: {
    height: 45,
    borderRadius: 22,
    backgroundColor:
      "rgba(255,255,255,0.7)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    marginBottom: 15,
  },

  addIngredientText: {
    color: "#FF555A",
    fontSize: 15,
    fontWeight: "900",
  },

  createdBy: {
    textAlign: "center",
    color: "#777",
    fontSize: 14,
    fontWeight: "700",
    marginTop: 8,
    marginBottom: 15,
  },

  publishButton: {
    height: 55,
    backgroundColor: "#111",
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },

  publishText: {
    color: "white",
    fontSize: 17,
    fontWeight: "900",
  },
  categoriesContainer: {
  flexDirection: "row",
  flexWrap: "wrap",
  gap: 8,
  marginBottom: 15,
  },

  categoryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "white",
    borderRadius: 20,
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderWidth: 1.5,
    borderColor: "#FF555A",
  },

  categoryButtonSelected: {
    backgroundColor: "#FF555A",
  },

  categoryButtonText: {
    color: "#FF555A",
    fontSize: 14,
    fontWeight: "800",
  },

  categoryButtonTextSelected: {
    color: "white",
  },
});
