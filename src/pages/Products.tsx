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
import LoginModal from "../components/LoginModal";
import TopBar from "../components/TopBar";
import "./Products.css";

interface Product {
  id: number;
  name: string;
  price: string;
  image: string;
  color: string;
}

const sampleProducts: Product[] = [
  {
    id: 1,
    name: "Mango Tango",
    price: "₱180",
    image:
      "https://img.freepik.com/premium-photo/mango-juice-bottle-glass_123827-19891.jpg",
    color: "linear-gradient(135deg, #f9d423, #ff4e50)",
  },
  {
    id: 2,
    name: "Strawberry Dream",
    price: "₱160",
    image:
      "https://img.freepik.com/premium-photo/fresh-strawberry-juice-bottle_123827-19802.jpg",
    color: "linear-gradient(135deg, #ff758c, #ff7eb3)",
  },
  {
    id: 3,
    name: "Citrus Splash",
    price: "₱170",
    image:
      "https://img.freepik.com/premium-photo/fresh-orange-juice-bottle_123827-20000.jpg",
    color: "linear-gradient(135deg, #f6d365, #fda085)",
  },
  {
    id: 4,
    name: "Tropical Twist",
    price: "₱190",
    image:
      "https://img.freepik.com/premium-photo/pineapple-juice-glass_123827-19902.jpg",
    color: "linear-gradient(135deg, #fce38a, #f38181)",
  },
];

const sizeOptions = [
  { label: "Small", addOn: 0 },
  { label: "Medium", addOn: 10 },
  { label: "Large", addOn: 20 },
];

const Products: React.FC = () => {
  const [searchText, setSearchText] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [addedProduct, setAddedProduct] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState("Small");
  const { addToCart } = useCart();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const filteredProducts = sampleProducts.filter((product) =>
    product.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleAddToCartClick = (product: Product) => {
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

    const basePrice = parseFloat(selectedProduct.price.replace("₱", ""));
    const sizePrice =
      basePrice +
      (selectedSize === "Medium" ? 10 : selectedSize === "Large" ? 20 : 0);

    addToCart({
      id: `${selectedProduct.id}-${selectedSize}`,
      name: `${selectedProduct.name} (${selectedSize})`,
      price: sizePrice,
      image: selectedProduct.image,
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
