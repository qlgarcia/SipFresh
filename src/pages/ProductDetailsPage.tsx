import React, { useEffect, useState } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonButton,
  IonImg,
  IonSelect,
  IonSelectOption,
  IonToast,
  IonButtons,
  IonBackButton,
} from "@ionic/react";
import { useParams, useHistory } from "react-router-dom";
import { getProduct } from "../services/productService";
import { useCart } from "../context/CartContext";

interface RouteParams {
  id: string;
}

const sizeOptions = [
  { label: "Small", addOn: 0 },
  { label: "Medium", addOn: 10 },
  { label: "Large", addOn: 20 },
];

const ProductDetailsPage: React.FC = () => {
  const { id } = useParams<RouteParams>();
  const history = useHistory();
  const [product, setProduct] = useState<any>(null);
  const [size, setSize] = useState<string>("Small");
  const [showToast, setShowToast] = useState(false);
  const { addToCart } = useCart();

  useEffect(() => {
    let mounted = true;
    if (!id) return;
    (async () => {
      try {
        const p = await getProduct(id);
        if (mounted) setProduct(p);
      } catch (err) {
        console.error("Failed to load product:", err);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  const handleAddToCart = () => {
    if (!product) return;
    const basePrice = typeof product.price === "string" ? parseFloat(product.price.replace("₱", "")) : Number(product.price || 0);
    const addOn = size === "Medium" ? 10 : size === "Large" ? 20 : 0;
    const price = basePrice + addOn;

    addToCart({
      id: `${product.id}-${size}`,
      name: `${product.name} (${size})`,
      price,
      image: product.image || product.imageURL || "",
      quantity: 1,
    });

    setShowToast(true);
  };

  if (!product) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonBackButton defaultHref="/products" />
            </IonButtons>
            <IonTitle>Product</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">Loading...</IonContent>
      </IonPage>
    );
  }

  const basePrice = typeof product.price === "string" ? parseFloat(product.price.replace("₱", "")) : Number(product.price || 0);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/products" />
          </IonButtons>
          <IonTitle>{product.name}</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <IonCard>
          {product.image || product.imageURL ? (
            <IonImg src={product.image || product.imageURL} />
          ) : (
            <div style={{ height: 240, display: "flex", alignItems: "center", justifyContent: "center", background: "#f4f4f4" }}>
              <span>No image</span>
            </div>
          )}

          <IonCardHeader>
            <IonCardTitle>{product.name}</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <p><strong>Category:</strong> {product.category || "—"}</p>
            {product.description && <p>{product.description}</p>}
            <p style={{ fontSize: 18, fontWeight: 700 }}>₱{basePrice}</p>

            <div style={{ marginTop: 12 }}>
              <IonSelect value={size} okText="Select" onIonChange={(e) => setSize(e.detail.value)}>
                {sizeOptions.map((s) => (
                  <IonSelectOption key={s.label} value={s.label}>
                    {s.label} {s.addOn ? `( +₱${s.addOn} )` : "(₱0)"}
                  </IonSelectOption>
                ))}
              </IonSelect>
            </div>

            <div style={{ marginTop: 16 }}>
              <IonButton expand="block" color="success" onClick={handleAddToCart}>
                Add to Cart
              </IonButton>
              <IonButton expand="block" fill="outline" onClick={() => history.goBack()} style={{ marginTop: 8 }}>
                Back
              </IonButton>
            </div>
          </IonCardContent>
        </IonCard>

        <IonToast isOpen={showToast} onDidDismiss={() => setShowToast(false)} message={`🛒 Added ${product.name} (${size}) to cart`} duration={1500} color="success" />
      </IonContent>
    </IonPage>
  );
};

export default ProductDetailsPage;
