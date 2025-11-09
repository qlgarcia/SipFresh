<?php
require_once 'includes/header.php';

// Add style to prevent FOUC
echo '
<style>
    .js-loading * {
        visibility: hidden;
    }
    
    .js-loading:before {
        content: "";
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: white;
        z-index: 999999;
    }
</style>
<script>
    // Add loading class to body
    document.body.classList.add("js-loading");
    
    // Listen for window load
    window.addEventListener("load", function() {
        // Remove loading class once everything is loaded
        document.body.classList.remove("js-loading");
    });
</script>
';

// === PAYPAL PHP START (merged from "New folder\htdocs\checkout.php") ===
require_once 'includes/paypal_config.php';
require_once 'includes/payment_settings.php';
require_once 'includes/wallet_functions.php';
if (!defined('PAYPAL_CLIENT_ID')) {
    error_log('WARNING: PAYPAL_CLIENT_ID not defined in includes/paypal_config.php');
    define('PAYPAL_CLIENT_ID', ''); // Empty placeholder - admin must configure
}
// === PAYPAL PHP END ===

$page_title = 'Checkout';

// Load admin-controlled payment settings
$paymentSettings = getPaymentSettings();
// Determine default available payment (order preference)
$paymentOrder = ['wallet', 'credit_card', 'paypal', 'cod'];
$defaultPayment = '';
foreach ($paymentOrder as $methodKey) {
	if (!empty($paymentSettings[$methodKey])) { $defaultPayment = $methodKey; break; }
}
if ($defaultPayment === '') { $defaultPayment = 'credit_card'; } // fallback

// Check if user is logged in
if (!isLoggedIn()) {
    redirect('login.php?redirect=checkout.php');
}

$user_id = $_SESSION['user_id'];
$session_id = session_id();

// Check if we have selected items from cart
$selected_items = [];
if (isset($_POST['selected_items'])) {
    // Handle POST data from cart
    $selected_items = json_decode($_POST['selected_items'], true);
    
    // Check for JSON decode errors
    if (json_last_error() !== JSON_ERROR_NONE) {
        error_log("Checkout Debug - JSON decode error: " . json_last_error_msg());
        $selected_items = [];
    } else {
        error_log("Checkout Debug - Selected items: " . json_encode($selected_items));
        error_log("Checkout Debug - Selected items count: " . count($selected_items));
    }
}

// If no selected items, get all cart items (fallback)
// Additional check: ensure it's not just null from json_decode error
if (empty($selected_items) || !is_array($selected_items)) {
    error_log("Checkout Debug - No selected items, using fallback to get all cart items");
    $cart_items = getCartItems($user_id, $session_id);
    if (empty($cart_items)) {
        redirect('cart.php');
    }
    error_log("Checkout Debug - Fallback: Using " . count($cart_items) . " cart items");
} else {
    error_log("Checkout Debug - Processing selected items only");
    error_log("Checkout Debug - Selected items is not empty, count: " . count($selected_items));
    error_log("Checkout Debug - Selected items content: " . json_encode($selected_items));
    // Get full item details for selected items
    $cart_items = [];
    $db = Database::getInstance();
    foreach ($selected_items as $selected_item) {
        $item = $db->fetchOne(
            "SELECT p.*, c.quantity FROM products p 
             LEFT JOIN cart c ON p.product_id = c.product_id 
             WHERE p.product_id = ? AND c.user_id = ?",
            [$selected_item['product_id'], $user_id]
        );
        
        if ($item) {
            // === CART VALIDATION START (merged) ===
            // Validate CURRENT product status and stock (not historical)
            $is_currently_active = $item['is_active'] && $item['status'] === 'active' && $item['stock_quantity'] > 0;
            
            if (!$is_currently_active) {
                // Remove from cart and add to removed items
                $db->execute("DELETE FROM cart WHERE user_id = ? AND product_id = ?", 
                            [$user_id, $item['product_id']]);
                
                $removed_items[] = [
                    'product_id' => $item['product_id'],
                    'product_name' => $item['product_name'],
                    'reason' => !$item['is_active'] ? 'Product is no longer available' : 
                               ($item['status'] !== 'active' ? 'Product status changed' : 'Product is out of stock')
                ];
            } else {
                // Product is currently active - validate quantity
                if ($selected_item['quantity'] > $item['stock_quantity']) {
                    $selected_item['quantity'] = $item['stock_quantity'];
                    $db->execute("UPDATE cart SET quantity = ? WHERE user_id = ? AND product_id = ?", 
                                [$selected_item['quantity'], $user_id, $item['product_id']]);
                }
                // === CART VALIDATION END ===
                
                $item['quantity'] = $selected_item['quantity'];
                $cart_items[] = $item;
            }
        }
    }
    
    // === CHECKOUT VALIDATION START (merged) ===
    if (function_exists('validateCheckoutEligibility')) {
        $validation_result = validateCheckoutEligibility($cart_items);
        if (!$validation_result['can_proceed']) {
            // Remove invalid products from cart
            foreach ($validation_result['invalid_products'] as $invalid) {
                $db->execute("DELETE FROM cart WHERE user_id = ? AND product_id = ?", 
                            [$user_id, $invalid['product_id']]);
            }
            
            // Add to removed items
            $removed_items = array_merge($removed_items ?? [], $validation_result['invalid_products']);
            
            // Filter out invalid products from cart_items
            $valid_product_ids = array_column($validation_result['invalid_products'], 'product_id');
            $cart_items = array_filter($cart_items, function($item) use ($valid_product_ids) {
                return !in_array($item['product_id'], $valid_product_ids);
            });
        }
    } else {
        // TODO: install validateCheckoutEligibility function or implement similar validation
        error_log('WARNING: validateCheckoutEligibility function not available - cart validation limited');
    }
    
    // If items were removed, redirect back to cart with message
    if (!empty($removed_items)) {
        $_SESSION['checkout_error'] = 'Some items in your cart are no longer available and have been removed.';
        $_SESSION['removed_items'] = $removed_items;
        redirect('cart.php');
    }
    // === CHECKOUT VALIDATION END ===
    
    if (empty($cart_items)) {
        redirect('cart.php');
    }
}

error_log("Checkout Debug - Items to be processed: " . json_encode(array_map(function($item) {
    return ['product_id' => $item['product_id'], 'product_name' => $item['product_name'], 'quantity' => $item['quantity']];
}, $cart_items)));

$cart_total = calculateCartTotal($cart_items);
$tax_rate = 0.08; // 8% tax
$tax_amount = $cart_total * $tax_rate;
$shipping_amount = $cart_total >= 50 ? 0 : 9.99; // Free shipping over $50
$final_total = $cart_total + $tax_amount + $shipping_amount;

$error_message = '';
$success_message = '';

// Get user addresses
$db = Database::getInstance();
$addresses = $db->fetchAll("SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC", [$user_id]);
// Get wallet balance for UI and server-side validation
$wallet_balance = getUserWalletBalance($user_id);

// Handle form submission
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    error_log("Checkout Debug - Form submission: selected_items preserved = " . (isset($_POST['selected_items']) ? 'YES' : 'NO'));
    if (isset($_POST['selected_items'])) {
        error_log("Checkout Debug - Form submission: selected_items value = " . $_POST['selected_items']);
    }
    error_log("Checkout Debug - Form submission: cart_items count = " . count($cart_items));
    error_log("Checkout Debug - Form submission: cart_items content = " . json_encode(array_map(function($item) {
        return ['product_id' => $item['product_id'], 'product_name' => $item['product_name'], 'quantity' => $item['quantity']];
    }, $cart_items)));
    $shipping_address_id = (int)($_POST['shipping_address'] ?? 0);
    $billing_address_id = (int)($_POST['billing_address'] ?? 0);
    $payment_method = sanitizeInput($_POST['payment_method'] ?? '');
    $notes = sanitizeInput($_POST['notes'] ?? '');
    $use_wallet_amount = 0.00;
    
    // Validation
    if (!$shipping_address_id) {
        $error_message = 'Please select a shipping address.';
    } elseif (!$billing_address_id) {
        $error_message = 'Please select a billing address.';
    } elseif (!$payment_method) {
        $error_message = 'Please select a payment method.';
    } else {
        try {
            $db->beginTransaction();

            // If wallet payment selected, ensure sufficient balance and calculate amount to charge
            if ($payment_method === 'wallet') {
                if ($wallet_balance === false) {
                    throw new Exception('Unable to retrieve wallet balance');
                }
                if ($wallet_balance < $final_total) {
                    throw new Exception('Insufficient wallet balance. Please choose another payment method or top up your wallet.');
                }
                // Full payment via wallet
                $use_wallet_amount = $final_total;
            }

            // Create order (payment_status will be 'paid' immediately for wallet payments)
            $order_number = generateOrderNumber();
            $payment_status = ($payment_method === 'wallet') ? 'paid' : 'pending';
            $order_id = $db->insert(
                "INSERT INTO orders (user_id, order_number, total_amount, tax_amount, shipping_amount, 
                 shipping_address_id, billing_address_id, payment_method, payment_status, notes) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                [$user_id, $order_number, $final_total, $tax_amount, $shipping_amount, 
                 $shipping_address_id, $billing_address_id, $payment_method, $payment_status, $notes]
            );
            
            // Add order items
            error_log("Checkout Debug - Order creation: About to create order with " . count($cart_items) . " items");
            foreach ($cart_items as $item) {
                error_log("Checkout Debug - Adding to order: " . $item['product_name'] . " (ID: " . $item['product_id'] . ", Qty: " . $item['quantity'] . ")");
                $price = $item['sale_price'] ? $item['sale_price'] : $item['price'];
                $db->insert(
                    "INSERT INTO order_items (order_id, product_id, product_name, product_sku, 
                     quantity, unit_price, total_price) VALUES (?, ?, ?, ?, ?, ?, ?)",
                    [$order_id, $item['product_id'], $item['product_name'], $item['sku'] ?? 'N/A', 
                     $item['quantity'], $price, $price * $item['quantity']]
                );
                
                // Update product stock
                $db->execute(
                    "UPDATE products SET stock_quantity = stock_quantity - ? WHERE product_id = ?",
                    [$item['quantity'], $item['product_id']]
                );
                
                // Update sales count for best sellers tracking
                $db->execute(
                    "UPDATE products SET sales_count = COALESCE(sales_count, 0) + ? WHERE product_id = ?",
                    [$item['quantity'], $item['product_id']]
                );
            }
            
            // Clear only the selected items from cart after successful order
            error_log("Checkout Debug - Cart clearing: About to clear " . count($cart_items) . " items from cart");
            foreach ($cart_items as $item) {
                error_log("Checkout Debug - Clearing cart item: " . $item['product_name'] . " (ID: " . $item['product_id'] . ")");
                $db->execute(
                    "DELETE FROM cart WHERE user_id = ? AND product_id = ?",
                    [$user_id, $item['product_id']]
                );
            }
            
            // If wallet payment, debit the wallet within same transaction context to keep consistency
            if ($payment_method === 'wallet' && $use_wallet_amount > 0) {
                // debitWallet will start/commit its own transaction only if one is not active.
                // Since we have an active transaction here, call debiting SQL directly to avoid nested transaction issues.
                $row = $db->fetchOne("SELECT balance FROM user_wallets WHERE user_id = ? FOR UPDATE", [$user_id]);
                $balance_now = $row ? (float)$row['balance'] : 0.00;
                if ($balance_now < $use_wallet_amount) {
                    throw new Exception('Insufficient wallet balance during finalization.');
                }

                $updated = $db->execute(
                    "UPDATE user_wallets SET balance = balance - ?, last_updated = NOW() WHERE user_id = ?",
                    [$use_wallet_amount, $user_id]
                );
                if ($updated === false) {
                    throw new Exception('Failed to deduct wallet balance');
                }

                // Record wallet transaction (negative amount)
                $db->execute(
                    "INSERT INTO wallet_transactions (user_id, amount, type, reference_id) VALUES (?, ?, ?, ?)",
                    [$user_id, -1 * $use_wallet_amount, 'payment', $order_id]
                );

                // Create wallet notification
                require_once 'includes/wallet_notifications.php';
                createWalletNotification($user_id, -$use_wallet_amount, 'payment', $order_id);
            }

            $db->commit();

            // Create order placed notification
            createOrderPlacedNotification($order_id);

            // Redirect to order confirmation
            redirect("order-confirmation.php?order_id={$order_id}");
            
        } catch (Exception $e) {
            $db->rollback();
            $error_message = 'Failed to process order: ' . $e->getMessage();
            error_log("Checkout error: " . $e->getMessage() . " - " . $e->getTraceAsString());
        }
    }
}
?>

<main>
    <div class="container">
        <div class="checkout-page">
            <h1>Checkout</h1>
            
            <?php if ($error_message): ?>
                <div class="alert alert-error">
                    <?php echo $error_message; ?>
                </div>
            <?php endif; ?>
            
            <div class="checkout-layout">
                <!-- Checkout Steps -->
                <div class="checkout-steps">
                    <div class="step active">
                        <span class="step-number">1</span>
                        <span class="step-title">Shipping</span>
                    </div>
                    <div class="step">
                        <span class="step-number">2</span>
                        <span class="step-title">Payment</span>
                    </div>
                    <div class="step">
                        <span class="step-number">3</span>
                        <span class="step-title">Review</span>
                    </div>
                </div>
                
                <form method="POST" class="checkout-form">
                    <!-- Preserve selected items data -->
                    <input type="hidden" name="selected_items" value="<?php echo htmlspecialchars(json_encode($selected_items)); ?>">
                    <div class="checkout-content">
                        <!-- Shipping Address -->
                        <section class="checkout-section">
                            <h2>Shipping Address</h2>
                            
                            <?php if (!empty($addresses)): ?>
                                <div class="address-options">
                                    <?php foreach ($addresses as $address): ?>
                                    <div class="address-option">
                                        <input type="radio" name="shipping_address" value="<?php echo $address['address_id']; ?>" 
                                               id="ship_<?php echo $address['address_id']; ?>" 
                                               <?php echo $address['is_default'] ? 'checked' : ''; ?>>
                                        <label for="ship_<?php echo $address['address_id']; ?>">
                                            <div class="address-content">
                                                <strong><?php echo htmlspecialchars($address['first_name'] . ' ' . $address['last_name']); ?></strong>
                                                <?php if ($address['company']): ?>
                                                    <br><?php echo htmlspecialchars($address['company']); ?>
                                                <?php endif; ?>
                                                <br><?php echo htmlspecialchars($address['address_line1']); ?>
                                                <?php if ($address['address_line2']): ?>
                                                    <br><?php echo htmlspecialchars($address['address_line2']); ?>
                                                <?php endif; ?>
                                                <br><?php 
                                                $address_parts = [];
                                                if ($address['city']) $address_parts[] = $address['city'];
                                                if ($address['province']) $address_parts[] = $address['province'];
                                                elseif ($address['state']) $address_parts[] = $address['state'];
                                                if ($address['postal_code']) $address_parts[] = $address['postal_code'];
                                                echo htmlspecialchars(implode(', ', $address_parts));
                                                ?>
                                                <br>Philippines
                                                <?php if ($address['phone']): ?>
                                                    <br><?php echo htmlspecialchars($address['phone']); ?>
                                                <?php endif; ?>
                                                <?php if ($address['is_default']): ?>
                                                    <span class="default-badge">Default</span>
                                                <?php endif; ?>
                                            </div>
                                        </label>
                                    </div>
                                    <?php endforeach; ?>
                                </div>
                            <?php endif; ?>
                            
                            <div class="add-address">
                                <a href="profile.php?tab=addresses" class="btn btn-outline">
                                    <i class="fas fa-plus"></i> Add New Address
                                </a>
                            </div>
                        </section>
                        
                        <!-- Billing Address -->
                        <section class="checkout-section">
                            <h2>Billing Address</h2>
                            
                            <div class="billing-options">
                                <label class="checkbox-option">
                                    <input type="checkbox" id="same_as_shipping" checked>
                                    <span>Same as shipping address</span>
                                </label>
                            </div>
                            
                            <div id="billing-address-section" style="display: none;">
                                <?php if (!empty($addresses)): ?>
                                    <div class="address-options">
                                        <?php foreach ($addresses as $address): ?>
                                        <div class="address-option">
                                            <input type="radio" name="billing_address" value="<?php echo $address['address_id']; ?>" 
                                                   id="bill_<?php echo $address['address_id']; ?>" 
                                                   <?php echo $address['is_default'] ? 'checked' : ''; ?>>
                                            <label for="bill_<?php echo $address['address_id']; ?>">
                                                <div class="address-content">
                                                    <strong><?php echo htmlspecialchars($address['first_name'] . ' ' . $address['last_name']); ?></strong>
                                                    <?php if ($address['company']): ?>
                                                        <br><?php echo htmlspecialchars($address['company']); ?>
                                                    <?php endif; ?>
                                                    <br><?php echo htmlspecialchars($address['address_line1']); ?>
                                                    <?php if ($address['address_line2']): ?>
                                                        <br><?php echo htmlspecialchars($address['address_line2']); ?>
                                                    <?php endif; ?>
                                                    <br><?php 
                                                    $address_parts = [];
                                                    if ($address['city']) $address_parts[] = $address['city'];
                                                    if ($address['province']) $address_parts[] = $address['province'];
                                                    elseif ($address['state']) $address_parts[] = $address['state'];
                                                    if ($address['postal_code']) $address_parts[] = $address['postal_code'];
                                                    echo htmlspecialchars(implode(', ', $address_parts));
                                                    ?>
                                                    <br>Philippines
                                                    <?php if ($address['phone']): ?>
                                                        <br><?php echo htmlspecialchars($address['phone']); ?>
                                                    <?php endif; ?>
                                                </div>
                                            </label>
                                        </div>
                                        <?php endforeach; ?>
                                    </div>
                                <?php endif; ?>
                            </div>
                        </section>
                        
                        <!-- Payment Method -->
                        <section class="checkout-section">
                            <h2>Payment Method</h2>
                            
                            <div class="payment-options">
                                <?php if (!empty($paymentSettings['wallet'])): ?>
                                <div class="payment-option">
                                    <input type="radio" name="payment_method" value="wallet" id="wallet" <?php echo $defaultPayment==='wallet' ? 'checked' : ''; ?>>
                                    <label for="wallet">
                                        <i class="fas fa-wallet"></i>
                                        <span>Wallet <small style="display:block; font-size:12px; color:#666;">Balance: <?php echo '₱' . number_format($wallet_balance, 2); ?></small></span>
                                    </label>
                                </div>
                                <?php endif; ?>
                                <?php if (!empty($paymentSettings['credit_card'])): ?>
                                <div class="payment-option">
                                    <input type="radio" name="payment_method" value="credit_card" id="credit_card" <?php echo $defaultPayment==='credit_card' ? 'checked' : ''; ?>>
                                    <label for="credit_card">
                                        <i class="fas fa-credit-card"></i>
                                        <span>Credit Card</span>
                                    </label>
                                </div>
                                <?php endif; ?>
                                
                                <?php if (!empty($paymentSettings['paypal'])): ?>
                                <div class="payment-option">
                                    <input type="radio" name="payment_method" value="paypal" id="paypal" <?php echo $defaultPayment==='paypal' ? 'checked' : ''; ?>>
                                    <label for="paypal">
                                        <i class="fab fa-paypal"></i>
                                        <span>PayPal</span>
                                    </label>
                                </div>
                                <?php endif; ?>
                                
                                <?php if (!empty($paymentSettings['cod'])): ?>
                                <div class="payment-option">
                                    <input type="radio" name="payment_method" value="cod" id="cod" <?php echo $defaultPayment==='cod' ? 'checked' : ''; ?>>
                                    <label for="cod">
                                        <i class="fas fa-truck"></i>
                                        <span>Cash on Delivery</span>
                                    </label>
                                </div>
                                <?php endif; ?>
                            </div>
                            
                            <!-- === PAYMENT UI CONTAINERS START === -->
                            <?php if (!empty($paymentSettings['paypal'])): ?>
                            <div id="paypal-button-container-merged" style="display: none; margin-top: 20px;"></div>
                            <?php endif; ?>
                            <?php 
                            if (!empty($paymentSettings['cod'])) {
                            	require_once 'includes/payment-modules/cod.php';
                            	echo renderCODForm();
                            }
                            ?>
                            <!-- === PAYMENT UI CONTAINERS END === -->
                            
                            <div id="credit-card-form" class="payment-form">
                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="card_number">Card Number</label>
                                        <input type="text" id="card_number" placeholder="1234 5678 9012 3456" maxlength="19">
                                    </div>
                                </div>
                                
                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="expiry_date">Expiry Date</label>
                                        <input type="text" id="expiry_date" placeholder="MM/YY" maxlength="5">
                                    </div>
                                    <div class="form-group">
                                        <label for="cvv">CVV</label>
                                        <input type="text" id="cvv" placeholder="123" maxlength="4">
                                    </div>
                                </div>
                                
                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="card_name">Name on Card</label>
                                        <input type="text" id="card_name" placeholder="John Doe">
                                    </div>
                                </div>
                            </div>
                        </section>
                        
                        <!-- Order Notes -->
                        <section class="checkout-section">
                            <h2>Order Notes (Optional)</h2>
                            <div class="form-group">
                                <textarea name="notes" placeholder="Any special instructions for your order..."></textarea>
                            </div>
                        </section>
                    </div>
                    
                    <!-- Order Summary -->
                    <div class="order-summary">
                        <h3>Order Summary</h3>
                        
                        <div class="summary-items">
                            <?php foreach ($cart_items as $item): ?>
                            <div class="summary-item">
                                <div class="item-info">
                                    <span class="item-name"><?php echo htmlspecialchars($item['product_name']); ?></span>
                                    <span class="item-qty">Qty: <?php echo $item['quantity']; ?></span>
                                </div>
                                <span class="item-price">
                                    <?php 
                                    $price = $item['sale_price'] ? $item['sale_price'] : $item['price'];
                                    echo formatPrice($price * $item['quantity']); 
                                    ?>
                                </span>
                            </div>
                            <?php endforeach; ?>
                        </div>
                        
                        <div class="summary-totals">
                            <div class="summary-line">
                                <span>Subtotal</span>
                                <span><?php echo formatPrice($cart_total); ?></span>
                            </div>
                            
                            <div class="summary-line">
                                <span>Shipping</span>
                                <span><?php echo $shipping_amount > 0 ? formatPrice($shipping_amount) : 'Free'; ?></span>
                            </div>
                            
                            <div class="summary-line">
                                <span>Tax</span>
                                <span><?php echo formatPrice($tax_amount); ?></span>
                            </div>
                            
                            <div class="summary-line total">
                                <span>Total</span>
                                <span><?php echo formatPrice($final_total); ?></span>
                            </div>
                        </div>
                        
                        <button type="submit" class="btn btn-primary place-order-btn">
                            <i class="fas fa-lock"></i> Place Order
                        </button>
                        
                        <div class="security-info">
                            <i class="fas fa-shield-alt"></i>
                            <span>Your payment information is secure and encrypted</span>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    </div>
</main>

<style>
.checkout-page {
    padding: 20px 0;
}

.checkout-page h1 {
    font-size: 32px;
    color: #2c3e50;
    margin-bottom: 30px;
}

.checkout-layout {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 30px;
}

.checkout-steps {
    display: flex;
    justify-content: center;
    margin-bottom: 40px;
    grid-column: 1 / -1;
}

.step {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 15px 25px;
    background: #f8f9fa;
    border-radius: 25px;
    margin: 0 10px;
    color: #666;
}

.step.active {
    background: #e74c3c;
    color: white;
}

.step-number {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background: rgba(255,255,255,0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
}

.step.active .step-number {
    background: rgba(255,255,255,0.9);
    color: #e74c3c;
}

.checkout-content {
    background: white;
    border-radius: 10px;
    padding: 30px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.checkout-section {
    margin-bottom: 40px;
    padding-bottom: 30px;
    border-bottom: 1px solid #eee;
}

.checkout-section:last-child {
    border-bottom: none;
    margin-bottom: 0;
}

.checkout-section h2 {
    color: #2c3e50;
    margin-bottom: 20px;
    font-size: 20px;
}

.address-options {
    display: flex;
    flex-direction: column;
    gap: 15px;
    margin-bottom: 20px;
}

.address-option {
    position: relative;
}

.address-option input[type="radio"] {
    position: absolute;
    opacity: 0;
}

.address-option label {
    display: block;
    padding: 15px;
    border: 2px solid #ddd;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s;
}

.address-option input[type="radio"]:checked + label {
    border-color: #e74c3c;
    background: #fff5f5;
}

.address-content {
    font-size: 14px;
    line-height: 1.5;
}

.default-badge {
    background: #e74c3c;
    color: white;
    padding: 2px 8px;
    border-radius: 10px;
    font-size: 12px;
    margin-left: 10px;
}

.add-address {
    text-align: center;
}

.billing-options {
    margin-bottom: 20px;
}

.checkbox-option {
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
}

.checkbox-option input[type="checkbox"] {
    width: 18px;
    height: 18px;
}

.payment-options {
    display: flex;
    gap: 15px;
    margin-bottom: 20px;
}

.payment-option {
    flex: 1;
}

.payment-option input[type="radio"] {
    position: absolute;
    opacity: 0;
}

.payment-option label {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 20px;
    border: 2px solid #ddd;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s;
}

.payment-option input[type="radio"]:checked + label {
    border-color: #e74c3c;
    background: #fff5f5;
}

.payment-option i {
    font-size: 24px;
    margin-bottom: 10px;
    color: #666;
}

.payment-option input[type="radio"]:checked + label i {
    color: #e74c3c;
}

.payment-form {
    background: #f8f9fa;
    padding: 20px;
    border-radius: 8px;
    margin-top: 20px;
}

.form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 15px;
    margin-bottom: 15px;
}

.form-row:first-child {
    grid-template-columns: 1fr;
}

.form-group label {
    display: block;
    margin-bottom: 5px;
    font-weight: 600;
    color: #2c3e50;
}

.form-group input,
.form-group textarea {
    width: 100%;
    padding: 12px;
    border: 1px solid #ddd;
    border-radius: 5px;
    font-size: 16px;
}

.form-group textarea {
    height: 80px;
    resize: vertical;
}

.order-summary {
    background: white;
    border-radius: 10px;
    padding: 25px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    height: fit-content;
    position: sticky;
    top: 20px;
}

.order-summary h3 {
    color: #2c3e50;
    margin-bottom: 20px;
    font-size: 20px;
}

.summary-items {
    margin-bottom: 20px;
}

.summary-item {
    display: flex;
    justify-content: space-between;
    margin-bottom: 10px;
    padding-bottom: 10px;
    border-bottom: 1px solid #eee;
}

.item-info {
    display: flex;
    flex-direction: column;
}

.item-name {
    font-weight: 600;
    color: #2c3e50;
}

.item-qty {
    font-size: 12px;
    color: #666;
}

.item-price {
    font-weight: 600;
    color: #e74c3c;
}

.summary-totals {
    margin-bottom: 25px;
}

.summary-line {
    display: flex;
    justify-content: space-between;
    margin-bottom: 10px;
}

.summary-line.total {
    font-size: 18px;
    font-weight: bold;
    color: #2c3e50;
    border-top: 2px solid #e74c3c;
    padding-top: 10px;
}

.place-order-btn {
    width: 100%;
    padding: 15px;
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 15px;
}

.security-info {
    display: flex;
    align-items: center;
    gap: 10px;
    color: #666;
    font-size: 14px;
    text-align: center;
}

.security-info i {
    color: #27ae60;
}

.alert {
    padding: 15px;
    border-radius: 5px;
    margin-bottom: 20px;
}

.alert-error {
    background: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
}

@media (max-width: 768px) {
    .checkout-layout {
        grid-template-columns: 1fr;
    }
    
    .checkout-steps {
        flex-direction: column;
        gap: 10px;
    }
    
    .step {
        margin: 0;
    }
    
    .payment-options {
        flex-direction: column;
    }
    
    .form-row {
        grid-template-columns: 1fr;
    }
    
    .order-summary {
        position: static;
    }
}
</style>

<script>
// Handle billing address toggle
document.getElementById('same_as_shipping').addEventListener('change', function() {
    const billingSection = document.getElementById('billing-address-section');
    if (this.checked) {
        billingSection.style.display = 'none';
        // Copy shipping address to billing
        const shippingAddress = document.querySelector('input[name="shipping_address"]:checked');
        if (shippingAddress) {
            document.querySelector('input[name="billing_address"]').value = shippingAddress.value;
        }
    } else {
        billingSection.style.display = 'block';
    }
});

// Format card number
document.getElementById('card_number').addEventListener('input', function(e) {
    let value = e.target.value.replace(/\s/g, '').replace(/[^0-9]/gi, '');
    let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
    e.target.value = formattedValue;
});

// Format expiry date
document.getElementById('expiry_date').addEventListener('input', function(e) {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length >= 2) {
        value = value.substring(0, 2) + '/' + value.substring(2, 4);
    }
    e.target.value = value;
});

// Format CVV
document.getElementById('cvv').addEventListener('input', function(e) {
    e.target.value = e.target.value.replace(/[^0-9]/g, '');
});

// Handle payment method changes
document.querySelectorAll('input[name="payment_method"]').forEach(radio => {
    radio.addEventListener('change', function() {
        const creditCardForm = document.getElementById('credit-card-form');
        const paypalContainer = document.getElementById('paypal-button-container-merged');
        const codForm = document.getElementById('cod-payment-form');
        
        // Hide all payment forms first
        [creditCardForm, paypalContainer, codForm].forEach(form => {
            if (form) form.style.display = 'none';
        });
        
        // Show selected payment form
        switch(this.value) {
            case 'credit_card':
                if (creditCardForm) creditCardForm.style.display = 'block';
                break;
            case 'paypal':
                if (paypalContainer) paypalContainer.style.display = 'block';
                break;
            case 'cod':
                if (codForm) codForm.style.display = 'block';
                break;
        }
    });
});

// Ensure the correct default payment form is visible on load
(function() {
	const selected = document.querySelector('input[name="payment_method"]:checked');
	if (!selected) return;
	const creditCardForm = document.getElementById('credit-card-form');
	const paypalContainer = document.getElementById('paypal-button-container-merged');
	const codForm = document.getElementById('cod-payment-form');
	[creditCardForm, paypalContainer, codForm].forEach(form => { if (form) form.style.display = 'none'; });
	switch (selected.value) {
		case 'credit_card': if (creditCardForm) creditCardForm.style.display = 'block'; break;
		case 'paypal': if (paypalContainer) paypalContainer.style.display = 'block'; break;
		case 'cod': if (codForm) codForm.style.display = 'block'; break;
	}
})();
</script>

<!-- === PAYPAL JS START (merged) === -->
<script>
// PayPal Integration with Fallback
(function() {
    'use strict';
    
    const PAYPAL_CLIENT_ID = '<?php echo PAYPAL_CLIENT_ID; ?>';
    const paypalContainer = document.getElementById('paypal-button-container-merged');
    
    if (!paypalContainer) {
        console.error('PayPal container not found');
        return;
    }
    
    
    if (!PAYPAL_CLIENT_ID) {
        showPayPalError('PayPal configuration missing. Please configure PAYPAL_CLIENT_ID in includes/paypal_config.php');
        return;
    }
    
    // If a clean global is already present, use it directly to avoid re-loading conflicts
    if (typeof window.paypal !== 'undefined' && window.paypal && window.paypal.Buttons) {
        console.log('Using existing PayPal global');
        initializePayPalButtons(window.paypal);
        return;
    }

    // Create script element and load PayPal SDK under a unique namespace to avoid collisions
    const script = document.createElement('script');
    const PAYPAL_NAMESPACE = 'paypal_sdk';
    script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(PAYPAL_CLIENT_ID)}&components=buttons&currency=USD&intent=capture&disable-funding=credit,card&debug=true`;
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.setAttribute('data-namespace', PAYPAL_NAMESPACE);
    
    // Suppress PayPal SDK internal errors that don't affect functionality
    const originalConsoleError = console.error;
    console.error = function(...args) {
        if (args[0] && args[0].includes && args[0].includes('startsWith')) {
            return; // Suppress known PayPal SDK internal error
        }
        originalConsoleError.apply(console, args);
    };
    
    script.onload = function() {
        console.log('PayPal SDK script tag loaded');
        
        setTimeout(() => {
            console.error = originalConsoleError;
        }, 2000);
        
        const maxAttempts = 10;
        let attempts = 0;
        const waitForPaypal = setInterval(() => {
            attempts++;
            const paypalRef = (window[PAYPAL_NAMESPACE]) ? window[PAYPAL_NAMESPACE] : window.paypal;
            if (paypalRef && paypalRef.Buttons) {
                clearInterval(waitForPaypal);
                initializePayPalButtons(paypalRef);
            } else if (attempts >= maxAttempts) {
                clearInterval(waitForPaypal);
                console.error('PayPal SDK global not available after load');
                showPayPalError('PayPal SDK not available. Please refresh the page and try again.');
            }
        }, 200);
    };
    
    script.onerror = function() {
        console.error('Failed to load PayPal SDK');
        showPayPalError('Failed to load PayPal SDK. Please refresh the page and try again.');
    };
    
    document.head.appendChild(script);
    
    function initializePayPalButtons(paypalRef) {
        if (!paypalRef || !paypalRef.Buttons) {
            showPayPalError('PayPal SDK not available. Please refresh the page and try again.');
            return;
        }
        
        try {
            paypalRef.Buttons({
                style: {
                    layout: 'vertical',
                    color: 'gold',
                    shape: 'rect',
                    label: 'paypal'
                },
                createOrder: function(data, actions) {
                    console.log('Creating PayPal order...');
                    const form = document.querySelector('.checkout-form');
                    if (!form) {
                        throw new Error('Checkout form not found');
                    }
                    
                    // IMPORTANT: Extract items only from the current Order Summary section
                    // This ensures PayPal processes the same items as other payment methods
                    // and not the entire cart
                    const orderItems = [];
                    document.querySelectorAll('.summary-item').forEach(item => {
                        const nameElement = item.querySelector('.item-name');
                        const qtyElement = item.querySelector('.item-qty');
                        const priceElement = item.querySelector('.item-price');
                        
                        if (nameElement && qtyElement && priceElement) {
                            const qty = parseInt(qtyElement.textContent.replace('Qty: ', '')) || 0;
                            const price = parseFloat(priceElement.textContent.replace(/[^0-9.]/g, '')) || 0;
                            
                            if (qty > 0 && price > 0) {
                                orderItems.push({
                                    name: nameElement.textContent.trim(),
                                    quantity: qty,
                                    unit_price: (price / qty).toFixed(2)
                                });
                            }
                        }
                    });
                    
                    const formData = new FormData(form);
                    formData.append('payment_method', 'paypal');
                    formData.append('order_items', JSON.stringify(orderItems));
                    
                    // Ensure required address fields are present in POST
                    try {
                        const shippingChecked = document.querySelector('input[name="shipping_address"]:checked');
                        const sameAsShipping = document.getElementById('same_as_shipping');
                        if (sameAsShipping && sameAsShipping.checked && shippingChecked) {
                            formData.set('billing_address', shippingChecked.value);
                        }
                    } catch (e) {
                        console.warn('Address sync warning:', e);
                    }
                    
                    // NOTE: This call now mirrors the server-side item-selection and validation
                    // logic used by cart.php and the COD module. The server will validate
                    // the provided Order Summary items, create the local order (pending),
                    // reserve stock and return a PayPal order id. This prevents PayPal from
                    // bypassing the standard Place Order flow.
                    return fetch('paypal-create-order-server.php', {
                        method: 'POST',
                        credentials: 'same-origin',
                        headers: { 'Accept': 'application/json' },
                        body: formData
                    })
                    .then(async (res) => {
                        const text = await res.text();
                        let json;
                        try {
                            json = JSON.parse(text);
                        } catch (err) {
                            console.error('Create order returned non-JSON. Raw response:', text.slice(0, 1000));
                            throw new Error('Create order failed: Non-JSON response from server');
                        }
                        if (!res.ok || json.error) {
                            const msg = json.error || 'Create order failed';
                            throw new Error(msg);
                        }
                        return json;
                    })
                    .then(data => {
                        paypalContainer.setAttribute('data-local-order-id', data.order_id);
                        return data.id;
                    });
                },
                onApprove: function(data, actions) {
                    console.log('PayPal order approved:', data);
                    const localOrderId = paypalContainer.getAttribute('data-local-order-id');
                    
                    if (!localOrderId) {
                        throw new Error('Local order ID not found');
                    }
                    
                    const fd = new FormData();
                    fd.append('paypal_order_id', data.orderID);
                    fd.append('order_id', localOrderId);
                    
                    return fetch('paypal-capture-order.php', {
                        method: 'POST',
                        credentials: 'same-origin',
                        body: fd
                    })
                    .then(async (res) => {
                        const text = await res.text();
                        let json;
                        try {
                            json = JSON.parse(text);
                        } catch (err) {
                            console.error('Capture returned non-JSON. Raw response:', text.slice(0, 2000));
                            throw new Error('Payment capture failed: Invalid server response');
                        }
                        if (!res.ok || json.error) {
                            throw new Error(json.error || 'Capture failed');
                        }
                        return json;
                    })
                    .then(resp => {
                        if (resp.redirect) {
                            window.location.href = resp.redirect;
                        }
                    })
                    .catch(err => {
                        console.error('Payment capture failed:', err);
                        alert('Payment capture failed: ' + err.message);
                    });
                },
                onError: function(err) {
                    console.error('PayPal error:', err);
                    alert('PayPal error: ' + (err?.message || 'Unexpected error occurred'));
                },
                onCancel: function(data) {
                    console.log('PayPal payment cancelled:', data);
                }
            }).render('#paypal-button-container-merged').then(function() {
                console.log('PayPal buttons rendered successfully');
            }).catch(function(err) {
                console.error('Failed to render PayPal buttons:', err);
                showPayPalError('Failed to initialize PayPal buttons. Please try again.');
            });
        } catch (err) {
            console.error('PayPal initialization error:', err);
            showPayPalError('PayPal initialization failed. Please refresh the page and try again.');
        }
    }
    
    function showPayPalError(message) {
        paypalContainer.innerHTML = `
            <div style="text-align: center; padding: 20px; border: 1px solid #ff6b6b; border-radius: 5px; background-color: #ffe0e0; color: #d63031;">
                <i class="fas fa-exclamation-triangle"></i>
                <p style="margin: 10px 0;">${message}</p>
                <button onclick="location.reload()" style="padding: 8px 16px; background: #ff6b6b; color: white; border: none; border-radius: 3px; cursor: pointer;">
                    Refresh Page
                </button>
            </div>
        `;
    }
})();
</script>
<!-- === PAYPAL JS END === -->

<?php require_once 'includes/footer.php'; ?>

