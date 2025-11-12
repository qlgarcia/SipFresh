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
import { useLocation, useHistory } from "react-router-dom";

// We'll use realtime products from Firestore
interface RemoteProduct {
  id?: string;
  name: string;
  price: number | string;
  imageURL?: string;
  image?: string;
  color?: string;
  category?: string;
  stock?: number;
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
  const [toastMessage, setToastMessage] = useState("");
  const [toastColor, setToastColor] = useState<"success" | "danger">("success");
  const [user, setUser] = useState<User | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<RemoteProduct | null>(null);
  const [selectedSize, setSelectedSize] = useState("Small");
  const { cart, addToCart } = useCart();
  const location = useLocation();
  const history = useHistory();
  const categoryFilter = new URLSearchParams(location.search).get("category") || "";

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsub = listenToProducts((prods) => {
      const normalized = (prods as RemoteProduct[]).map((product) => ({
        ...product,
        stock:
          typeof product.stock === "number"
            ? product.stock
            : typeof product.stock === "string"
            ? Number(product.stock)
            : undefined,
      }));
      setProducts(normalized);
    });
    return () => unsub();
  }, []);

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchText.toLowerCase());
    const matchesCategory = categoryFilter ? (product.category || "") === categoryFilter : true;
    return matchesSearch && matchesCategory;
  });

  const getQuantityInCart = (productId?: string) => {
    if (!productId) return 0;
    return cart.reduce((sum, item) => (item.productId === productId ? sum + item.quantity : sum), 0);
  };

  const handleAddToCartClick = (product: RemoteProduct) => {
    if (!user) {
      setShowLogin(true);
      return;
    }

    const currentStock = typeof product.stock === "number" ? product.stock : undefined;
    const quantityInCart = getQuantityInCart(product.id);
    if (currentStock !== undefined && quantityInCart >= currentStock) {
      setToastColor("danger");
      setToastMessage("Sorry, this product is out of stock.");
      setShowToast(true);
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

    const productId = selectedProduct.id || `${selectedProduct.name}`;
    const stockValue =
      typeof selectedProduct.stock === "number"
        ? selectedProduct.stock
        : typeof selectedProduct.stock === "string"
        ? Number(selectedProduct.stock)
        : undefined;

    const success = addToCart({
      id: `${productId}-${selectedSize}`,
      productId,
      name: `${selectedProduct.name} (${selectedSize})`,
      price: sizePrice,
      image: selectedProduct.image || selectedProduct.imageURL || "",
      quantity: 1,
      size: selectedSize,
      stock: stockValue,
    });

    if (!success) {
      setToastColor("danger");
      setToastMessage("Sorry, this product is out of stock.");
      setShowToast(true);
      setShowConfirm(false);
      return;
    }

    setToastColor("success");
    setToastMessage(`🛒 Added ${selectedProduct.name} (${selectedSize}) to cart!`);
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
            {filteredProducts.map((product) => {
              const productId = product.id || `${product.name}`;
              const quantityInCart = getQuantityInCart(productId);
              return (
                <IonCol size="6" sizeMd="4" key={product.id || productId}>
                  <IonCard className="product-card-modern">
                    <div
                      className="product-image-wrapper"
                      style={{ background: (product as any).color || undefined }}
                    >
                      {/* Support both `image` and `imageURL` fields coming from Firestore. */}
                      {(() => {
                        const imgSrc = (product as any).image || (product as any).imageURL || 
                          "https://via.placeholder.com/320x200?text=No+Image";
                        return (
                          <img
                            src={imgSrc}
                            alt={product.name}
                            className="product-image"
                          />
                        );
                      })()}
                    </div>
                    <IonCardHeader>
                      <IonCardTitle className="product-title">
                        {product.name}
                      </IonCardTitle>
                    </IonCardHeader>
                    <IonCardContent>
                      <p className="price-text">{product.price}</p>
                      <div
                        className={`stock-indicator ${
                          typeof product.stock === "number" && product.stock > 0 ? "in-stock" : "out-of-stock"
                        }`}
                      >
                        {typeof product.stock === "number"
                          ? product.stock > 0
                            ? `In stock: ${Math.max(product.stock - quantityInCart, 0)}`
                            : "Out of stock"
                          : "Stock unavailable"}
                      </div>
                      <div className="product-actions">
                        <IonButton
                          size="small"
                          color="success"
                          fill="solid"
                          className="compact-btn add-to-cart-btn"
                          disabled={
                            typeof product.stock === "number" &&
                            quantityInCart >= product.stock
                          }
                          onClick={() => handleAddToCartClick(product)}
                        >
                          <IonIcon slot="icon-only" icon={cartOutline} />
                        </IonButton>
                        <IonButton
                          size="small"
                          color="medium"
                          fill="outline"
                          className="compact-btn"
                          onClick={() => product.id && history.push(`/product/${product.id}`)}
                        >
                          <IonIcon
                            slot="icon-only"
                            icon={informationCircleOutline}
                          />
                        </IonButton>
                      </div>
                    </IonCardContent>
                  </IonCard>
                </IonCol>
              );
            })}
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
          message={toastMessage}
          duration={1500}
          color={toastColor}
        />

        {/* LOGIN MODAL */}
        <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />
      </IonContent>
    </IonPage>
  );
};

export default Products;
