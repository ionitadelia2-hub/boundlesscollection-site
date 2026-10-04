// cart.js - Gestionare coș local pentru Boundless Collection
document.addEventListener("DOMContentLoaded", () => {
    initAddToCartButtons();
    updateCartIconCount();
});

function getCart() {
    try {
        const cart = JSON.parse(
            localStorage.getItem("boundless_cart")
        );

        if (!Array.isArray(cart)) {
            return [];
        }

        return cart.filter(item =>
            item &&
            typeof item.id === "string" &&
            Number.isFinite(item.price) &&
            item.price >= 0 &&
            Number.isSafeInteger(item.quantity) &&
            item.quantity > 0
        );
    } catch {
        return [];
    }
}

function saveCart(cart) {
    localStorage.setItem("boundless_cart", JSON.stringify(cart));
    updateCartIconCount();
}

function initAddToCartButtons() {
    document.body.addEventListener("click", (e) => {
        const btn = e.target.closest(".add-to-cart");
        if (!btn) return;

        const id = btn.getAttribute("data-id");
        const title = btn.getAttribute("data-title");
        const price = parseFloat(btn.getAttribute("data-price"));
        const rawImage = btn.getAttribute("data-image");

const image = rawImage
    ? new URL(rawImage, "https://boundlesscollection.ro").href
    : "";
        const url = btn.getAttribute("data-url");

        // Cantitatea minimă setată în products.csv
        const minQuantity = Math.max(
            1,
            parseInt(btn.getAttribute("data-min-quantity") || "1", 10) || 1
        );

        // Cantitatea aleasă de client pe pagina produsului
        const quantityInput = document.getElementById("productQuantity");

        let selectedQuantity = minQuantity;

        if (quantityInput) {
            selectedQuantity = Math.max(
                minQuantity,
                parseInt(quantityInput.value || String(minQuantity), 10) || minQuantity
            );

            // Corectăm și vizual inputul dacă a introdus sub minim
            quantityInput.value = selectedQuantity;
        }

        let cart = getCart();
        const existingIndex = cart.findIndex(item => item.id === id);

        if (existingIndex > -1) {

            // Păstrăm cantitatea minimă reală a produsului
            cart[existingIndex].minQuantity = minQuantity;

            // Adăugăm cantitatea selectată de client
            cart[existingIndex].quantity += selectedQuantity;

            // Siguranță suplimentară
            if (cart[existingIndex].quantity < minQuantity) {
                cart[existingIndex].quantity = minQuantity;
            }

        } else {

            // Produs nou în coș
            cart.push({
                id,
                title,
                price,
                image,
                url,
                quantity: selectedQuantity,
                minQuantity: minQuantity
            });
        }

        saveCart(cart);

        // Efect vizual rapid pe buton
        const originalText = btn.innerHTML;

        btn.innerHTML = "✓ Adăugat!";
        btn.style.backgroundColor = "#d9a74a";
        btn.style.color = "#fff";

        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.style.backgroundColor = "";
            btn.style.color = "";

            window.location.href = "/cart.html";
        }, 500);
    });
}

function updateCartIconCount() {
    const cart = getCart();
    const count = cart.reduce((total, item) => total + item.quantity, 0);
    const badges = document.querySelectorAll(".cart-count-badge");
    badges.forEach(badge => {
        badge.textContent = count;
        badge.style.display = count > 0 ? "inline-block" : "none";
    });
}