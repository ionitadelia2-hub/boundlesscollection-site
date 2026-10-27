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
        e.preventDefault();

        const id = btn.getAttribute("data-id");
        const isCaricature = id?.startsWith("caricatura-personalizata-");
        const themeSelect = document.getElementById("caricatureTheme");
        const theme = isCaricature ? (themeSelect ? themeSelect.value : (btn.getAttribute("data-theme") || new URLSearchParams(location.search).get("tema"))) : null;
        const themeImages = new Map([
            ["Crăciun", "/images/caricaturi/caricatura-craciun-noua.png"],
            ["Valentine's Day", "/images/caricaturi/caricatura-valentines-day-noua.png"],
            ["Cuplu", "/images/caricaturi/caricatura-cuplu-noua.png"],
            ["Meserii", "/images/caricaturi/caricatura-meserii-noua.png"],
            ["Zi de naștere", "/images/caricaturi/caricatura-zi-de-nastere-noua.png"]
        ]);
        const chosenTheme = themeImages.has(theme) ? theme : "";
        if (isCaricature && !chosenTheme) {
            if (themeSelect) {
                themeSelect.focus();
                themeSelect.reportValidity();
            } else {
                window.alert("Alege tematica pe pagina caricaturii înainte de a o adăuga în coș.");
            }
            return;
        }
        const baseTitle = btn.getAttribute("data-title") || "";
        const title = isCaricature && !baseTitle.includes(chosenTheme)
            ? baseTitle + " — " + chosenTheme
            : baseTitle;
        const price = parseFloat(btn.getAttribute("data-price"));
        const rawImage = isCaricature ? themeImages.get(chosenTheme) : btn.getAttribute("data-image");

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
        const existingIndex = cart.findIndex(item => item.id === id && (item.theme || "") === chosenTheme);

        if (existingIndex > -1) {

            // Actualizăm datele variantei dacă produsul exista deja în coș.
            Object.assign(cart[existingIndex], { title, price, image, url });

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
                theme: chosenTheme,
                title,
                price,
                image,
                url,
                quantity: selectedQuantity,
                minQuantity: minQuantity
            });
        }

        saveCart(cart);

        showCartConfirmation({ title, image, price, quantity: selectedQuantity }, btn);
    });
}

let cartConfirmationTrigger = null;

function showCartConfirmation(item, trigger) {
    let dialog = document.getElementById("boundless-cart-confirmation");
    if (!dialog) {
        const style = document.createElement("style");
        style.textContent = `
            #boundless-cart-confirmation {
                box-sizing:border-box; width:calc(100% - 32px); max-width:440px;
                max-height:calc(100dvh - 32px); overflow:auto; margin:auto;
                padding:26px; border:1px solid #efd7e2; border-radius:20px;
                background:#fff; color:#2a2a2a; font-family:'Poppins',sans-serif;
                box-shadow:0 16px 60px rgba(48,36,42,.2); text-align:left;
            }
            #boundless-cart-confirmation::backdrop { background:rgba(48,36,42,.38); }
            #boundless-cart-confirmation .cart-confirm-close {
                display:block; margin:0 0 8px auto; padding:4px; width:32px; height:32px;
                border:0; background:transparent; color:#555; cursor:pointer; font-size:24px;
            }
            #boundless-cart-confirmation h2 { margin:0 0 20px; font-size:1.2rem; line-height:1.5; text-align:left; }
            #boundless-cart-confirmation .cart-confirm-product { display:flex; align-items:center; gap:14px; }
            #boundless-cart-confirmation img { width:72px; height:72px; object-fit:contain; border-radius:10px; flex-shrink:0; }
            #boundless-cart-confirmation img[hidden] { display:none; }
            #boundless-cart-confirmation .cart-confirm-info { min-width:0; overflow-wrap:anywhere; }
            #boundless-cart-confirmation .cart-confirm-name { margin:0 0 6px; font-size:.95rem; font-weight:600; line-height:1.5; }
            #boundless-cart-confirmation .cart-confirm-summary { margin:0; font-size:.85rem; line-height:1.7; color:#69555f; }
            #boundless-cart-confirmation .cart-confirm-actions { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:24px; }
            #boundless-cart-confirmation .cart-confirm-actions > * {
                box-sizing:border-box; display:flex; align-items:center; justify-content:center;
                min-height:46px; padding:12px; border:1px solid #e8c9d7; border-radius:10px;
                background:#fff; color:#49343e; font:inherit; font-size:.85rem; line-height:1.5;
                text-align:center; text-decoration:none; cursor:pointer;
            }
            #boundless-cart-confirmation .cart-confirm-actions a { background:#30242a; color:#fff; border-color:#30242a; }
            #boundless-cart-confirmation :focus-visible { outline:2px solid #a23366; outline-offset:3px; }
            @media (max-width:420px) {
                #boundless-cart-confirmation { padding:20px; }
                #boundless-cart-confirmation .cart-confirm-actions { grid-template-columns:1fr; }
            }
        `;
        document.head.appendChild(style);
        dialog = document.createElement("dialog");
        dialog.id = "boundless-cart-confirmation";
        dialog.setAttribute("aria-labelledby", "cart-confirm-title");
        dialog.innerHTML = `
            <button type="button" class="cart-confirm-close" aria-label="Închide confirmarea">×</button>
            <h2 id="cart-confirm-title">Produs adăugat în coș ✓</h2>
            <div class="cart-confirm-product">
                <img alt="" hidden>
                <div class="cart-confirm-info">
                    <p class="cart-confirm-name"></p>
                    <p class="cart-confirm-summary"></p>
                </div>
            </div>
            <div class="cart-confirm-actions">
                <button type="button" class="cart-confirm-continue" autofocus>Continuă cumpărăturile</button>
                <a href="/cart.html">Vezi coșul</a>
            </div>
        `;
        document.body.appendChild(dialog);
        dialog.querySelector(".cart-confirm-close").addEventListener("click", () => dialog.close());
        dialog.querySelector(".cart-confirm-continue").addEventListener("click", () => dialog.close());
        dialog.addEventListener("close", () => {
            if (cartConfirmationTrigger?.isConnected) cartConfirmationTrigger.focus({ preventScroll: true });
        });
        dialog.querySelector("img").addEventListener("error", function () { this.hidden = true; });
    }

    cartConfirmationTrigger = trigger;
    const money = new Intl.NumberFormat("ro-RO", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    dialog.querySelector(".cart-confirm-name").textContent = item.title;
    dialog.querySelector(".cart-confirm-summary").textContent = item.quantity + " buc. × " +
        money.format(item.price) + " lei = " + money.format(Math.round(item.price * 100) * item.quantity / 100) + " lei";
    const image = dialog.querySelector("img");
    image.hidden = !item.image;
    if (item.image) image.src = item.image;
    else image.removeAttribute("src");
    if (!dialog.open) dialog.showModal();
    dialog.querySelector(".cart-confirm-continue").focus();
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

