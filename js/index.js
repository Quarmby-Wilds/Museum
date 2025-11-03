//// ---- CART STORAGE ---- ////

// - LocalStorage key for saving cart data - //
const CART_KEY = "museumCartV1";

// - Read cart contents from LocalStorage - //
function readCart() {
    try {
        return JSON.parse(localStorage.getItem(CART_KEY)) || [];
    } catch {
        return [];
    }
}

// - Write updated cart contents to LocalStorage - //
function writeCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

//// ---- ADD TO CART ---- ////

// - Add a selected item to the cart or increase its quantity - //
function addToCart(button) {
    const id = button.dataset.id;
    const name = button.dataset.name;
    const price = parseFloat(button.dataset.price); // USD only
    const image = button.dataset.image;

    const cart = readCart();
    const existingItem = cart.find((item) => item.id === id);

    if (existingItem) {
        existingItem.qty += 1;
    } else {
        cart.push({id, name, price, image, qty: 1});
    }

    writeCart(cart);
    console.log(`Added to cart: ${name}`);

    // - Update the quantity badge on the shop page - //
    const itemCard = button.closest(".shop-item");
    const badge = itemCard?.querySelector(".qty-badge");
    const thisItem = cart.find((i) => i.id === id);

    if (badge && thisItem) {
        badge.textContent = `Qty: ${thisItem.qty}`;
    }

    // - Ensure all shop badges reflect localStorage state after add - //
    const _cartSnapshot = readCart();
    document.querySelectorAll(".shop-item").forEach((itemCard) => {
        const id = itemCard.dataset.id;
        const badge = itemCard.querySelector(".qty-badge");
        const thisItem = _cartSnapshot.find((i) => i.id === id);
        if (badge) badge.textContent = thisItem ? `Qty: ${thisItem.qty}` : "Qty: 0";
    });

}

//// ---- CART CONSTANTS ---- ////

// - Tax, shipping, and discount values - //
const TAX_RATE = 0.102;
const MEMBER_DISCOUNT_RATE = 0.15;
const SHIPPING_RATE = 25.0;

// - Volume discount tiers: [min, max, rate] - //
const VOLUME_TIERS = [
    [0.0, 49.99, 0.0],
    [50.0, 99.99, 0.05],
    [100.0, 199.99, 0.1],
    [200.0, Infinity, 0.15]
];

// - Determine applicable volume discount rate - //
function volumeRate(total) {
    for (const [min, max, rate] of VOLUME_TIERS) {
        if (total >= min && total <= max) return rate;
    }
    return 0;
}

//// ---- CART ITEM OPERATIONS ---- ////

// - Remove one quantity of an item (or delete it entirely) - //
function removeItem(id) {
    const cart = readCart();
    const item = cart.find((it) => it.id === id);

    if (item) {
        if (item.qty > 1) {
            item.qty -= 1;
        } else {
            const index = cart.indexOf(item);
            cart.splice(index, 1);
        }
    }

    writeCart(cart);
    render();
}

// - Clear all items from the cart - //
function clearCart() {
    localStorage.removeItem(CART_KEY);
    const memberToggle = document.getElementById("memberToggle");
    if (memberToggle) memberToggle.checked = false;
    render();
}

//// ---- UTILITIES ---- ////

// - Format numbers as USD currency text - //
function money(n) {
    const sign = n < 0 ? -1 : 1;
    const s = "$" + Math.abs(n).toFixed(2);
    return sign < 0 ? "(" + s + ")" : s;
}

//// ---- CART RENDERING ---- ////

// - Build and display the cart contents and summary - //
function render() {
    const itemsDiv = document.getElementById("items");
    const summaryPre = document.getElementById("summary");
    const emptyMsg = document.getElementById("emptyMsg");
    const isMember = document.getElementById("memberToggle")?.checked ?? false;

    let cart = readCart().filter((it) => it.qty > 0 && it.price > 0);

    // - Handle empty cart state - //
    if (cart.length === 0) {
        itemsDiv.hidden = true;
        summaryPre.hidden = true;
        emptyMsg.hidden = false;
        emptyMsg.textContent = "Your cart is empty.";
        return;
    }

    // - Prepare to display cart items - //
    itemsDiv.hidden = false;
    summaryPre.hidden = false;
    emptyMsg.hidden = true;

    // clear container
    itemsDiv.innerHTML = "";

    let itemTotal = 0;

    // - Build each item line with Add and Remove buttons - //
    cart.forEach((it) => {
        const lineTotal = it.qty * it.price;
        itemTotal += lineTotal;

        // container row
        const row = document.createElement("div");
        row.className = "cart-line";

        // left text
        const left = document.createElement("div");
        left.className = "cart-item-left";
        left.innerHTML = `${it.qty} × ${it.name} — ${money(lineTotal)}`;
        row.appendChild(left);

        // right button group
        const right = document.createElement("div");
        right.className = "cart-item-right";

        // Add button (reuses addToCart)
        const addBtn = document.createElement("button");
        addBtn.className = "cart-btn";
        addBtn.type = "button";
        addBtn.textContent = "Add";
        // set dataset so existing addToCart can use it
        addBtn.dataset.id = it.id;
        addBtn.dataset.name = it.name;
        addBtn.dataset.price = String(it.price);
        addBtn.dataset.image = it.image ?? "";
        addBtn.onclick = () => {
            addToCart(addBtn);
            // re-render so UI updates immediately
            render();
        };
        right.appendChild(addBtn);

        // Remove button (calls existing removeItem)
        const removeBtn = document.createElement("button");
        removeBtn.className = "cart-btn";
        removeBtn.type = "button";
        removeBtn.textContent = "Remove";
        removeBtn.onclick = () => {
            removeItem(it.id);
            // render() is called by removeItem already, but keep safe
            // (removeItem writes cart and calls render())
        };
        right.appendChild(removeBtn);

        row.appendChild(right);

        itemsDiv.appendChild(row);
    });

    // - Calculate discounts and totals - //
    const volRate = volumeRate(itemTotal);
    const volDiscount = itemTotal * volRate;
    const memberDiscount = isMember ? itemTotal * MEMBER_DISCOUNT_RATE : 0;

    let appliedVol = 0;
    let appliedMember = 0;

    // - Only one discount can be applied - //
    if (volDiscount > 0 && memberDiscount > 0) {
        const choice = prompt("Only one discount may be applied. Type 'M' for Member or 'V' for Volume:");
        if (choice && choice.toUpperCase() === "M") {
            appliedMember = memberDiscount;
        } else {
            appliedVol = volDiscount;
        }
    } else if (memberDiscount > 0) {
        appliedMember = memberDiscount;
    } else if (volDiscount > 0) {
        appliedVol = volDiscount;
    }

    // - Compute subtotal, tax, and final total - //
    const subTotal = itemTotal - appliedVol - appliedMember + SHIPPING_RATE;
    const taxAmount = subTotal * TAX_RATE;
    const invoiceTotal = subTotal + taxAmount;

    // - Display summary - //
    const summaryText = `
Subtotal of Items:   ${money(itemTotal)}
Volume Discount:     ${money(-appliedVol)}
Member Discount:     ${money(-appliedMember)}
Shipping:            ${money(SHIPPING_RATE)}
Subtotal (Taxable):  ${money(subTotal)}
Tax Rate:            ${(TAX_RATE * 100).toFixed(1)}%
Tax Amount:          ${money(taxAmount)}
Invoice Total:       ${money(invoiceTotal)}
    `;

    summaryPre.textContent = summaryText;
}

//// ---- EVENT LISTENERS ---- ////

// - React to member discount toggle and clear button - //
document.getElementById("memberToggle")?.addEventListener("change", render);
document.getElementById("clearBtn")?.addEventListener("click", clearCart);

// - Render cart when the page first loads - //
render();

//// ---- PAGE INITIALIZATION ---- ////

// - Wait until everything on the page has fully loaded before syncing qty badges - //
window.addEventListener("load", () => {
    const cart = readCart();
    document.querySelectorAll(".shop-item").forEach((itemCard) => {
        const id = itemCard.dataset.id;
        const badge = itemCard.querySelector(".qty-badge");
        const thisItem = cart.find((i) => i.id === id);
        if (badge) {
            badge.textContent = thisItem ? `Qty: ${thisItem.qty}` : "";
        }
    });
});

//// ---- MODALS ---- ////

// - Open image modal (shop page) - //
function openModal(imgElement) {
    const modal = document.getElementById("modal");
    const modalImage = document.getElementById("modal-image");
    modalImage.src = imgElement.src;
    modalImage.alt = imgElement.alt;
    modal.style.display = "block";
}

// - Open text modal (collections page) - //
function openModalText(imgElement) {
    const describedId = imgElement.getAttribute("aria-describedby");
    const describedElement = document.getElementById(describedId);
    const modal = document.getElementById("modal");
    const modalText = document.getElementById("modal-text");
    modalText.innerHTML = describedElement.innerHTML;
    modal.style.display = "block";
}

// - Close modal - //
function closeModal() {
    document.getElementById("modal").style.display = "none";
}

// - Close modal when clicking outside - //
window.onclick = function (event) {
    const modal = document.getElementById("modal");
    if (event.target === modal) {
        closeModal();
    }
};
