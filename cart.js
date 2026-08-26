// cart.js - Gestionare coș local pentru Boundless Collection
document.addEventListener("DOMContentLoaded", () => {
    initAddToCartButtons();
    updateCartIconCount();
});

function getCart() {
    return JSON.parse(localStorage.getItem("boundless_cart")) || [];
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
        const image = btn.getAttribute("data-image");
        const url = btn.getAttribute("data-url");

        const minQuantity = Math.max(
            1,
            parseInt(btn.getAttribute("data-min-quantity") || "1", 10) || 1
        );

        let cart = getCart();
        const existingIndex = cart.findIndex(item => item.id === id);

        if (existingIndex > -1) {
            // Păstrăm informația despre cantitatea minimă
            cart[existingIndex].minQuantity = minQuantity;

            // Dacă produsul există deja, mai adăugăm 1 buc.
            cart[existingIndex].quantity += 1;

            // Siguranță: nu permitem niciodată sub minim
            if (cart[existingIndex].quantity < minQuantity) {
                cart[existingIndex].quantity = minQuantity;
            }
        } else {
            cart.push({
                id,
                title,
                price,
                image,
                url,
                quantity: minQuantity,
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