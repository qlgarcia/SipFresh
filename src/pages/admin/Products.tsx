import React, { useEffect, useState } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonButton,
  IonIcon,
  IonSpinner,
  IonCard,
  IonCardContent,
  IonModal,
  IonInput,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonToast,
  IonButtons,
  IonFab,
  IonFabButton,
} from "@ionic/react";
import {
  createProduct,
  updateProduct,
  deleteProduct,
  getProducts,
  Product,
} from "../../services/productService";
import { add, createOutline, trashOutline } from "ionicons/icons";
import "./Products.css";

const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    price: 0,
    stock: 0,
    category: "",
    imageURL: "",
    description: "",
  });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const productsData = await getProducts();
      setProducts(productsData);
    } catch (error) {
      console.error("Error loading products:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        price: product.price,
        stock: product.stock,
        category: product.category,
        imageURL: product.imageURL,
        description: product.description || "",
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: "",
        price: 0,
        stock: 0,
        category: "",
        imageURL: "",
        description: "",
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingProduct(null);
  };

  const handleSave = async () => {
    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id!, formData);
        setToastMessage("Product updated successfully");
      } else {
        await createProduct(formData);
        setToastMessage("Product created successfully");
      }
      setShowToast(true);
      handleCloseModal();
      await loadProducts();
    } catch (error) {
      console.error("Error saving product:", error);
      setToastMessage("Error saving product");
      setShowToast(true);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await deleteProduct(id);
        setToastMessage("Product deleted successfully");
        setShowToast(true);
        await loadProducts();
      } catch (error) {
        console.error("Error deleting product:", error);
        setToastMessage("Error deleting product");
        setShowToast(true);
      }
    }
  };

  if (loading) {
    return (
      <IonPage>
        <IonContent className="ion-padding">
          <div style={{ display: "flex", justifyContent: "center", paddingTop: "50px" }}>
            <IonSpinner />
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Products Management</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        {products.length === 0 ? (
          <IonCard>
            <IonCardContent>
              <p style={{ textAlign: "center" }}>No products found</p>
            </IonCardContent>
          </IonCard>
        ) : (
          <IonList>
            {products.map((product) => (
              <IonItem key={product.id}>
                <IonLabel>
                  <h2>{product.name}</h2>
                  <p>
                    <strong>Price:</strong> ₱{product.price.toFixed(2)}
                  </p>
                  <p>
                    <strong>Stock:</strong> {product.stock}
                  </p>
                  <p>
                    <strong>Category:</strong> {product.category}
                  </p>
                </IonLabel>
                <IonButton
                  slot="end"
                  fill="clear"
                  onClick={() => handleOpenModal(product)}
                >
                  <IonIcon icon={createOutline} />
                </IonButton>
                <IonButton
                  slot="end"
                  fill="clear"
                  color="danger"
                  onClick={() => handleDelete(product.id!)}
                >
                  <IonIcon icon={trashOutline} />
                </IonButton>
              </IonItem>
            ))}
          </IonList>
        )}

        <IonFab vertical="bottom" horizontal="end" slot="fixed">
          <IonFabButton onClick={() => handleOpenModal()}>
            <IonIcon icon={add} />
          </IonFabButton>
        </IonFab>

        <IonModal isOpen={showModal} onDidDismiss={handleCloseModal}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>{editingProduct ? "Edit Product" : "New Product"}</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={handleCloseModal}>Close</IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            <IonInput
              label="Product Name"
              labelPlacement="stacked"
              value={formData.name}
              onIonInput={(e) => setFormData({ ...formData, name: e.detail.value! })}
            />
            <IonInput
              label="Price"
              labelPlacement="stacked"
              type="number"
              value={formData.price}
              onIonInput={(e) =>
                setFormData({ ...formData, price: parseFloat(e.detail.value!) || 0 })
              }
            />
            <IonInput
              label="Stock"
              labelPlacement="stacked"
              type="number"
              value={formData.stock}
              onIonInput={(e) =>
                setFormData({ ...formData, stock: parseInt(e.detail.value!) || 0 })
              }
            />
            <IonInput
              label="Category"
              labelPlacement="stacked"
              value={formData.category}
              onIonInput={(e) => setFormData({ ...formData, category: e.detail.value! })}
            />
            <IonInput
              label="Image URL"
              labelPlacement="stacked"
              value={formData.imageURL}
              onIonInput={(e) => setFormData({ ...formData, imageURL: e.detail.value! })}
            />
            <IonTextarea
              label="Description"
              labelPlacement="stacked"
              value={formData.description}
              onIonInput={(e) => setFormData({ ...formData, description: e.detail.value! })}
            />
            <IonButton expand="block" onClick={handleSave}>
              {editingProduct ? "Update Product" : "Create Product"}
            </IonButton>
          </IonContent>
        </IonModal>

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={2000}
          color="success"
        />
      </IonContent>
    </IonPage>
  );
};

export default Products;

