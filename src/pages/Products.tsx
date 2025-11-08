import React, { useState, useEffect } from "react";
import {
  IonPage,
  IonContent,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonButton,
  IonIcon,
  IonSearchbar,
  IonToast,
  IonAlert,
  IonSelect,
  IonSelectOption,
} from "@ionic/react";
import { addCircleOutline, cartOutline, informationCircleOutline } from "ionicons/icons";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "../firebaseConfig";
import { useCart } from "../context/CartContext";
import { listenToProducts } from "../services/productService";
import LoginModal from "../components/LoginModal";
import TopBar from "../components/TopBar";
import "./Products.css";
import { useLocation } from "react-router-dom";

// We'll use realtime products from Firestore
interface RemoteProduct {
  id?: string;
  name: string;
  price: number | string;
  imageURL?: string;
  image?: string;
  color?: string;
  category?: string;
}

const sizeOptions = [
  { label: "Small", addOn: 0 },
  { label: "Medium", addOn: 10 },
  { label: "Large", addOn: 20 },
];

const Products: React.FC = () => {
  const [searchText, setSearchText] = useState("");
  const [products, setProducts] = useState<RemoteProduct[]>([]);
  const [showToast, setShowToast] = useState(false);
  const [addedProduct, setAddedProduct] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<RemoteProduct | null>(null);
  const [selectedSize, setSelectedSize] = useState("Small");
  const { addToCart } = useCart();
  const location = useLocation();
  const categoryFilter = new URLSearchParams(location.search).get("category") || "";

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsub = listenToProducts((prods) => {
      setProducts(prods as RemoteProduct[]);
    });
    return () => unsub();
  }, []);

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchText.toLowerCase());
    const matchesCategory = categoryFilter ? (product.category || "") === categoryFilter : true;
    return matchesSearch && matchesCategory;
  });

  const handleAddToCartClick = (product: RemoteProduct) => {
    if (!user) {
      setShowLogin(true);
      return;
    }
    setSelectedProduct(product);
    setSelectedSize("Small");
    setShowConfirm(true);
  };

  const confirmAddToCart = () => {
    if (!selectedProduct) return;

    const basePrice =
      typeof selectedProduct.price === "string"
        ? parseFloat((selectedProduct.price as string).replace("₱", ""))
        : Number(selectedProduct.price || 0);
    const sizePrice =
      basePrice +
      (selectedSize === "Medium" ? 10 : selectedSize === "Large" ? 20 : 0);

    addToCart({
      id: `${selectedProduct.id}-${selectedSize}`,
      name: `${selectedProduct.name} (${selectedSize})`,
      price: sizePrice,
      image: selectedProduct.image || selectedProduct.imageURL || "",
      quantity: 1,
    });

    setAddedProduct(`${selectedProduct.name} (${selectedSize})`);
    setShowToast(true);
    setShowConfirm(false);
  };

  return (
    <IonPage>
      <TopBar />

      <IonContent fullscreen className="products-content">
        {/* SEARCH BAR */}
        <IonSearchbar
          placeholder="Search your favorite juice..."
          value={searchText}
          onIonChange={(e) => setSearchText(e.detail.value!)}
          className="product-searchbar"
        />

        {/* SECTION HEADER */}
        <div className="section-header">Available Juices</div>

        {/* PRODUCT GRID */}
        <IonGrid>
          <IonRow>
            {filteredProducts.map((product) => (
              <IonCol size="6" sizeMd="4" key={product.id}>
                <IonCard className="product-card-modern">
                  <div
                    className="product-image-wrapper"
                    style={{ background: product.color }}
                  >
                    <img
                      src={product.image}
                      alt={product.name}
                      className="product-image"
                    />
                  </div>
                  <IonCardHeader>
                    <IonCardTitle className="product-title">
                      {product.name}
                    </IonCardTitle>
                  </IonCardHeader>
                  <IonCardContent>
                    <p className="price-text">{product.price}</p>
                    <div className="product-actions">
                      <IonButton
                        size="small"
                        color="success"
                        fill="solid"
                        className="compact-btn"
                        onClick={() => handleAddToCartClick(product)}
                      >
                        <IonIcon slot="icon-only" icon={cartOutline} />
                      </IonButton>
                      <IonButton
                        size="small"
                        color="medium"
                        fill="outline"
                        className="compact-btn"
                      >
                        <IonIcon
                          slot="icon-only"
                          icon={cartOutline}
                        />
                      </IonButton>
                    </div>
                  </IonCardContent>
                </IonCard>
              </IonCol>
            ))}
          </IonRow>
        </IonGrid>

        {/* CONFIRMATION ALERT with SIZE SELECTOR */}
        <IonAlert
          isOpen={showConfirm}
          onDidDismiss={() => setShowConfirm(false)}
          header="Choose Size"
          message={
            selectedProduct
              ? `
            ${selectedProduct.name}
                Base Price: ${selectedProduct.price}
                Select Size:   
            `
              : ""
          }
          buttons={[
            {
              text: "Cancel",
              role: "cancel",
              cssClass: "alert-cancel-btn",
            },
            {
              text: "Add",
              handler: confirmAddToCart,
              cssClass: "alert-confirm-btn",
            },
          ]}
          inputs={[
            {
              name: "size",
              type: "radio",
              label: "Small (₱0)",
              value: "Small",
              checked: selectedSize === "Small",
              handler: () => setSelectedSize("Small"),
            },
            {
              name: "size",
              type: "radio",
              label: "Medium (+₱10)",
              value: "Medium",
              handler: () => setSelectedSize("Medium"),
            },
            {
              name: "size",
              type: "radio",
              label: "Large (+₱20)",
              value: "Large",
              handler: () => setSelectedSize("Large"),
            },
          ]}
        />

        {/* TOAST */}
        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={`🛒 Added ${addedProduct} to cart!`}
          duration={1500}
          color="success"
        />

        {/* LOGIN MODAL */}
        <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />
      </IonContent>
    </IonPage>
  );
};

export default Products;
