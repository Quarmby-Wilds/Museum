function addToCart(itemId) {
    alert("Added " + itemId + " to cart");
      // Future: Push to cart array
    }

function openModal(imgElement) {
    const modal = document.getElementById("modal");
    const modalImage = document.getElementById("modal-image");
    modalImage.src = imgElement.src;
    modalImage.alt = imgElement.alt;
    modal.style.display = "block";
}

function closeModal() {
    document.getElementById("modal").style.display = "none";
}

window.onclick = function(event) {
    const modal = document.getElementById("modal");
    if (event.target === modal) {
    closeModal();
    }
}