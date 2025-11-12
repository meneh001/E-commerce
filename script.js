let user = {};
let products = JSON.parse(localStorage.getItem("products") || "[]");

const modalContent = {
  terms: {
    title: "Terms & Conditions",
    body: `
      <ul>
        <li>Use Fantabolous legally and respectfully.</li>
        <li>You are responsible for your account and actions.</li>
        <li>Fantabolous is a marketplace, not a seller.</li>
        <li>We may suspend accounts that violate policies.</li>
        <li>We help resolve disputes but are not liable for transactions.</li>
      </ul>
    `
  },
  privacy: {
    title: "Privacy Policy",
    body: `
      <ul>
        <li>We collect your name, email, and role.</li>
        <li>We never sell your data.</li>
        <li>You can request deletion anytime.</li>
        <li>We use cookies to improve your experience.</li>
      </ul>
    `
  },
  refund: {
    title: "Refund & Return Policy",
    body: `
      <ul>
        <li>Refunds are handled by sellers directly.</li>
        <li>Contact the seller within 7 days of delivery.</li>
        <li>Digital products are non-refundable unless stated.</li>
        <li>Fantabolous does not issue refunds.</li>
      </ul>
    `
  },
  shipping: {
    title: "Shipping Information",
    body: `
      <ul>
        <li>Sellers set shipping fees and timelines.</li>
        <li>Buyers must confirm shipping before purchase.</li>
        <li>Fantabolous does not handle delivery.</li>
      </ul>
    `
  },
  help: {
    title: "Help Center",
    body: `
      <ul>
        <li><strong>FAQs:</strong> Common questions and answers.</li>
        <li><strong>Contact Us:</strong> Email support@fantabolous.com</li>
        <li><strong>Disputes:</strong> We help mediate buyer-seller issues.</li>
        <li><strong>Tech Support:</strong> For login or dashboard issues.</li>
      </ul>
    `
  }
};

function showModal(type) {
  document.getElementById("modalTitle").innerText = modalContent[type].title;
  document.getElementById("modalBody").innerHTML = modalContent[type].body;
  document.getElementById("modalOverlay").classList.remove("hidden");
}

function hideModal() {
  document.getElementById("modalOverlay").classList.add("hidden");
}

function toggleDarkMode() {
  document.body.classList.toggle("dark");
  localStorage.setItem("darkMode", document.body.classList.contains("dark"));
}

function acceptCookies() {
  localStorage.setItem("cookiesAccepted", "true");
  document.getElementById("cookieBanner").style.display = "none";
}

function signIn() {
  const name = document.getElementById("username").value.trim();
  const role = document.getElementById("role").value;
  if (!name || !role) return;
  user = { name, role };
  localStorage.setItem("user", JSON.stringify(user));
  document.getElementById("auth").classList.add("hidden");
  if (role === "buyer") {
    document.getElementById("buyerView").classList.remove("hidden");
    renderProducts();
  } else {
    document.getElementById("sellerView").classList.remove("hidden");
    renderSellerProducts();
  }
}

function logout() {
  localStorage.removeItem("user");
  location.reload();
}

function switchToSeller() {
  user.role = "seller";
  localStorage.setItem("user", JSON.stringify(user));
  document.getElementById("buyerView").classList.add("hidden");
  document.getElementById("sellerView").classList.remove("hidden");
  renderSellerProducts();
}

function switchToBuyer() {
  user.role = "buyer";
  localStorage.setItem("user", JSON.stringify(user));
  document.getElementById("sellerView").classList.add("hidden");
  document.getElementById("buyerView").classList.remove("hidden");
  renderProducts();
}

function toggleNotifications() {
  document.getElementById("buyerNotifications").classList.add("hidden");
  document.getElementById("sellerNotifications").classList.add("hidden");

  if (user.role === "buyer") {
    renderBuyerNotifications(true);
    const panel = document.getElementById("buyerNotifications");
    panel.classList.remove("hidden");
    panel.scrollIntoView({ behavior: "smooth" });
  } else {
    renderSellerNotifications(true);
    const panel = document.getElementById("sellerNotifications");
    panel.classList.remove("hidden");
    panel.scrollIntoView({ behavior: "smooth" });
  }

  updateNotificationCount(); // reset count after viewing
}

function updateNotificationCount() {
  let count = 0;
  products.forEach(p => {
    if (user.role === "buyer" && p.buyerRequest === user.name && p.approved === null) count++;
    if (user.role === "seller" && p.seller === user.name && p.buyerRequest && p.approved === null) count++;
  });

  const badge = document.getElementById("notifyCount");
  if (count > 0) {
    badge.innerText = count;
    badge.classList.remove("hidden");
  } else {
    badge.classList.add("hidden");
  }
}


function postProduct() {
  const name = document.getElementById("productName").value.trim();
  const desc = document.getElementById("productDesc").value.trim();
  const price = document.getElementById("price").value.trim();
  const contactPhone = document.getElementById("contactPhone").value.trim();
  const contactIG = document.getElementById("contactIG").value.trim();
  const contactEmail = document.getElementById("contactEmail").value.trim();
  const file = document.getElementById("media").files[0];
  if (!name || !desc || !price || !contactPhone || !contactIG || !contactEmail || !file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    const mediaURL = e.target.result;
    const type = file.type.startsWith("video") ? "video" : "image";
    const product = {
      seller: user.name,
      name, desc, price,
      contactPhone, contactIG, contactEmail,
      mediaURL, mediaType: type,
      approved: null,
      buyerRequest: null
    };
    products.push(product);
    localStorage.setItem("products", JSON.stringify(products));
    renderSellerProducts();
  };
  reader.readAsDataURL(file);
}

function renderProducts() {
  const list = document.getElementById("productList");
  const query = document.getElementById("searchInput").value.toLowerCase();
  list.innerHTML = "";
  products.forEach((p, index) => {
    if (p.name.toLowerCase().includes(query) || p.desc.toLowerCase().includes(query)) {
      const div = document.createElement("div");
      div.className = "product";
      div.innerHTML = `
        <strong>${p.name}</strong> by ${p.seller}<br/>
        <p>${p.desc}</p>
        <p><strong>Price:</strong> SLE ${p.price}</p>
        ${p.mediaType === "image" ? `<img src="${p.mediaURL}" />` : `<video src="${p.mediaURL}" controls></video>`}
        <button onclick="requestApproval(${index})">Buy</button>
      `;
      list.appendChild(div);
    }
  });
}

function requestApproval(index) {
  products[index].buyerRequest = user.name;
  localStorage.setItem("products", JSON.stringify(products));
  renderBuyerNotifications();
}

function renderBuyerNotifications() {
  const panel = document.getElementById("buyerNotifications");
  panel.innerHTML = "";
  products.forEach((p) => {
    if (p.buyerRequest === user.name && p.approved === null) {
      panel.innerHTML += `<p>You requested <strong>${p.name}</strong>. Waiting for approval.</p>`;
    } else if (p.buyerRequest === user.name && p.approved === true) {
      panel.innerHTML += `
        <p><strong>${p.name}</strong> approved!</p>
        <p>Contact Seller:</p>
        <a href="https://wa.me/${p.contactPhone}" target="_blank">WhatsApp</a><br/>
        <a href="https://instagram.com/${p.contactIG}" target="_blank">Instagram</a><br/>
        <a href="mailto:${p.contactEmail}">Email</a><br/>
        <a href="tel:${p.contactPhone}">Phone</a>
      `;
    } else if (p.buyerRequest === user.name && p.approved === false) {
      panel.innerHTML += `<p><strong>${p.name}</strong> was rejected.</p>`;
    }
  });
}

function renderSellerProducts() {
  const list = document.getElementById("sellerProducts");
  list.innerHTML = "";
  products.filter(p => p.seller === user.name).forEach((p, index) => {
    const div = document.createElement("div");
    div.className = "product";
    div.innerHTML = `
      <strong>${p.name}</strong><br/>
      <p>${p.desc}</p>
      <p><strong>Price:</strong> SLE ${p.price}</p>
      ${p.mediaType === "image" ? `<img src="${p.mediaURL}" />` : `<video src="${p.mediaURL}" controls></video>`}
      <p>Contact: ${p.contactPhone}, ${p.contactIG}, ${p.contactEmail}</p>
      <button onclick="deleteProduct(${index})">Delete</button>
    `;
    list.appendChild(div);
  });
}

function deleteProduct(index) {
  products.splice(index, 1);
  localStorage.setItem("products", JSON.stringify(products));
  renderSellerProducts();
  renderSellerNotifications();
}

function renderSellerNotifications() {
  const panel = document.getElementById("sellerNotifications");
  panel.innerHTML = "";
  products.forEach((p, index) => {
    if (p.seller === user.name && p.buyerRequest && p.approved === null) {
      panel.innerHTML += `
        <p><strong>${p.buyerRequest}</strong> wants to buy <strong>${p.name}</strong>.</p>
        <button onclick="sellerApprove(${index})">Approve</button>
        <button onclick="sellerReject(${index})">Reject</button>
      `;
    } else if (p.seller === user.name && p.buyerRequest) {
      panel.innerHTML += `
        <p><strong>${p.buyerRequest}</strong> requested <strong>${p.name}</strong>.</p>
        <p>Status: ${p.approved ? "✅ Approved" : "❌ Rejected"}</p>
      `;
    }
  });
}

function sellerApprove(index) {
  products[index].approved = true;
  localStorage.setItem("products", JSON.stringify(products));
  renderSellerNotifications();
  renderBuyerNotifications();
}

function sellerReject(index) {
  products[index].approved = false;
  localStorage.setItem("products", JSON.stringify(products));
  renderSellerNotifications();
  renderBuyerNotifications();
}

// Initialize on page load
window.onload = function () {
  if (localStorage.getItem("cookiesAccepted") === "true") {
    document.getElementById("cookieBanner").style.display = "none";
  }
  if (localStorage.getItem("darkMode") === "true") {
    document.body.classList.add("dark");
  }
  const savedUser = localStorage.getItem("user");
  if (savedUser) {
    user = JSON.parse(savedUser);
    document.getElementById("auth").classList.add("hidden");
    if (user.role === "buyer") {
      document.getElementById("buyerView").classList.remove("hidden");
      renderProducts();
      renderBuyerNotifications();
    } else {
      document.getElementById("sellerView").classList.remove("hidden");
      renderSellerProducts();
      renderSellerNotifications();
    }
  }
};
