"use strict";

document.documentElement.classList.add("js");

// Replace this sample destination with the clinic's verified WhatsApp number before launch.
const WHATSAPP_NUMBER = "8801700000000";
const REVIEW_STORAGE_KEY = "noor-dental-demo-reviews-v1";
const SAMPLE_REVIEWS = [
  {
    id: "sample-1",
    name: "Ayesha R.",
    rating: 5,
    text: "I felt listened to from the first minute. The explanations were so clear, I finally understood my treatment options.",
    status: "approved",
    source: "fictional-sample",
  },
  {
    id: "sample-2",
    name: "Nusrat J.",
    rating: 5,
    text: "A calm, unhurried visit. I liked that we made a plan together before getting started.",
    status: "approved",
    source: "fictional-sample",
  },
  {
    id: "sample-3",
    name: "Tariq H.",
    rating: 4,
    text: "The team helped me feel at ease and broke everything down into simple steps.",
    status: "approved",
    source: "fictional-sample",
  },
];

const byId = (id) => document.getElementById(id);
const menuToggle = byId("menu-toggle");
const navigationLinks = byId("primary-menu");
const mobileNavigationQuery = window.matchMedia("(max-width: 820px)");

function syncNavigationAccessibility() {
  if (!navigationLinks || !menuToggle) return;
  const isCollapsedMobileMenu = mobileNavigationQuery.matches && menuToggle.getAttribute("aria-expanded") !== "true";
  navigationLinks.toggleAttribute("inert", isCollapsedMobileMenu);
  if (isCollapsedMobileMenu) navigationLinks.setAttribute("aria-hidden", "true");
  else navigationLinks.removeAttribute("aria-hidden");
}

function closeMenu() {
  if (!menuToggle || !navigationLinks) return;
  const focusWasInsideMenu = navigationLinks.contains(document.activeElement);
  menuToggle.setAttribute("aria-expanded", "false");
  navigationLinks.classList.remove("is-open");
  document.body.classList.remove("menu-open");
  syncNavigationAccessibility();
  if (mobileNavigationQuery.matches && focusWasInsideMenu) menuToggle.focus();
}

menuToggle?.addEventListener("click", () => {
  const opening = menuToggle.getAttribute("aria-expanded") !== "true";
  menuToggle.setAttribute("aria-expanded", String(opening));
  navigationLinks.classList.toggle("is-open", opening);
  document.body.classList.toggle("menu-open", opening);
  syncNavigationAccessibility();
  if (!opening && mobileNavigationQuery.matches && navigationLinks.contains(document.activeElement)) menuToggle.focus();
});

navigationLinks?.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));
mobileNavigationQuery.addEventListener("change", closeMenu);
syncNavigationAccessibility();

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeMenu();
    byId("review-form-panel").hidden = true;
  }
});

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const revealItems = document.querySelectorAll(".reveal");
if ("IntersectionObserver" in window && !reducedMotion) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.1, rootMargin: "0px 0px -30px 0px" });
  revealItems.forEach((item) => revealObserver.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}

const currentYear = byId("current-year");
if (currentYear) currentYear.textContent = String(new Date().getFullYear());

const appointmentForm = byId("appointment-form");
const appointmentConfirmation = byId("booking-confirmation");
const submitBookingLink = byId("send-booking-whatsapp");
const preferredDate = byId("preferred-date");

function formatLocalDate(date) {
  const adjusted = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return adjusted.toISOString().slice(0, 10);
}
if (preferredDate) preferredDate.min = formatLocalDate(new Date());

appointmentForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!appointmentForm.reportValidity()) return;

  const formData = new FormData(appointmentForm);
  const fields = Object.fromEntries(formData.entries());
  const visitorName = String(fields.name).trim();
  const requestedDate = new Date(`${fields.date}T12:00:00`);
  const humanDate = new Intl.DateTimeFormat("en-BD", {
    day: "numeric", month: "long", year: "numeric",
    timeZone: "Asia/Dhaka",
  }).format(requestedDate);

  const whatsappMessage = [
    "Assalamu alaikum, I would like to request a free introductory dental consultation at Noor Dental Studio (demo).",
    `Name: ${visitorName}`,
    `Preferred date: ${humanDate}`,
    `Preferred time: ${fields.time}`,
    `Topic: ${fields.interest}`,
    "This is a sample website booking request.",
  ].join("\n");

  const encodedMessage = encodeURIComponent(whatsappMessage);
  submitBookingLink.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;
  byId("confirmation-summary").textContent = `${visitorName}, your appointment preferences are ready. No booking has been sent or confirmed. Check the message, then choose whether to contact this sample clinic on WhatsApp.`;
  appointmentForm.hidden = true;
  appointmentConfirmation.hidden = false;
  appointmentConfirmation.focus();
});

byId("edit-booking")?.addEventListener("click", () => {
  appointmentConfirmation.hidden = true;
  appointmentForm.hidden = false;
  byId("patient-name")?.focus();
});

function readReviews() {
  try {
    const saved = localStorage.getItem(REVIEW_STORAGE_KEY);
    if (!saved) return SAMPLE_REVIEWS.map((review) => ({ ...review }));
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) return SAMPLE_REVIEWS.map((review) => ({ ...review }));
    const validReviews = parsed.filter((review) =>
      review && typeof review.id === "string" && typeof review.name === "string" &&
      typeof review.text === "string" && [1, 2, 3, 4, 5].includes(Number(review.rating)) &&
      ["approved", "pending"].includes(review.status),
    );
    return validReviews;
  } catch {
    return SAMPLE_REVIEWS.map((review) => ({ ...review }));
  }
}

let reviews = readReviews();

function saveReviews() {
  try {
    localStorage.setItem(REVIEW_STORAGE_KEY, JSON.stringify(reviews));
    return true;
  } catch {
    return false;
  }
}

function createTag(tagName, className, content) {
  const element = document.createElement(tagName);
  if (className) element.className = className;
  if (content !== undefined) element.textContent = content;
  return element;
}

function renderReviews() {
  const reviewGrid = byId("review-grid");
  const published = reviews.filter((review) => review.status === "approved");
  reviewGrid.replaceChildren();

  if (published.length === 0) {
    reviewGrid.append(createTag("p", "manager-empty", "There are no approved demo reviews to display yet."));
  }

  published.forEach((review) => {
    const card = createTag("article", "review-card");
    card.setAttribute("aria-label", `${review.rating} out of 5 stars, demo review from ${review.name}`);
    card.append(createTag("div", "review-card-stars", "★".repeat(Number(review.rating))));
    card.append(createTag("span", "review-demo-label", review.source === "fictional-sample" ? "FICTIONAL DEMO REVIEW" : "SAMPLE REVIEW"));
    const quote = createTag("blockquote", "", `“${review.text}”`);
    const author = createTag("div", "review-author");
    const authorName = createTag("strong", "", review.name);
    const authorContext = createTag("span", "", review.source === "fictional-sample" ? "Example story · Dhaka" : "Submitted in this browser");
    author.append(authorName, authorContext);
    card.append(quote, author);
    reviewGrid.append(card);
  });

  const average = published.length
    ? published.reduce((total, review) => total + Number(review.rating), 0) / published.length
    : 0;
  byId("review-score").textContent = published.length ? average.toFixed(1) : "—";
  byId("review-count").textContent = `${published.length} ${published.length === 1 ? "fictional sample review" : "fictional sample reviews"}`;
}

const reviewFormPanel = byId("review-form-panel");
byId("open-review-form")?.addEventListener("click", () => {
  reviewFormPanel.hidden = false;
  byId("reviewer-name").focus();
  reviewFormPanel.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "nearest" });
});
byId("close-review-form")?.addEventListener("click", () => {
  reviewFormPanel.hidden = true;
  byId("open-review-form").focus();
});

byId("review-form")?.addEventListener("submit", (event) => {
  event.preventDefault();
  const reviewForm = event.currentTarget;
  if (!reviewForm.reportValidity()) return;

  const values = new FormData(reviewForm);
  const newReview = {
    id: `visitor-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: String(values.get("name")).trim(),
    rating: Number(values.get("rating")),
    text: String(values.get("review")).trim(),
    status: "pending",
    source: "local-browser-demo",
  };
  reviews.push(newReview);
  const saved = saveReviews();
  renderReviews();
  renderManager();
  byId("review-status").textContent = saved
    ? "Thank you. Your sample review is pending approval in this browser; it will not appear on the public demo yet."
    : "Your review is pending approval for this page view, but browser storage is unavailable. It will not reach a real clinic.";
  reviewForm.reset();
  byId("review-form-panel").scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "nearest" });
});

const managerPanel = byId("review-manager-panel");
const managerQueue = byId("manager-queue");
const managerToggle = byId("toggle-review-manager");

function makeManagerButton(label, className, onClick) {
  const button = createTag("button", className, label);
  button.type = "button";
  button.addEventListener("click", onClick);
  return button;
}

function renderManager() {
  managerQueue.replaceChildren();
  if (reviews.length === 0) {
    managerQueue.append(createTag("p", "manager-empty", "No sample reviews are in this browser. Add a demonstration review to try the moderation controls."));
    return;
  }

  reviews.forEach((review) => {
    const entry = createTag("article", "manager-entry");
    const summary = createTag("div", "manager-entry-summary");
    summary.append(
      createTag("strong", "", review.name),
      createTag("small", "", ` · ${review.status === "pending" ? "PENDING APPROVAL" : "VISIBLE IN DEMO"} · ${review.rating}/5 · ${review.source === "fictional-sample" ? "FICTIONAL" : "LOCAL BROWSER"}`),
      createTag("blockquote", "", review.text),
    );

    const actions = createTag("div", "manager-entry-actions");
    const editArea = createTag("form", "manager-edit");
    editArea.hidden = true;

    const nameLabel = createTag("label", "", "Display name");
    const nameInput = document.createElement("input");
    nameInput.required = true;
    nameInput.maxLength = 48;
    nameInput.value = review.name;
    nameLabel.append(nameInput);

    const reviewLabel = createTag("label", "", "Review text");
    const reviewInput = document.createElement("textarea");
    reviewInput.required = true;
    reviewInput.minLength = 12;
    reviewInput.maxLength = 500;
    reviewInput.rows = 3;
    reviewInput.value = review.text;
    reviewLabel.append(reviewInput);

    const ratingLabel = createTag("label", "", "Rating");
    const ratingSelect = document.createElement("select");
    [3, 4, 5].forEach((rating) => {
      const option = createTag("option", "", `${rating} / 5`);
      option.value = String(rating);
      option.selected = Number(review.rating) === rating;
      ratingSelect.append(option);
    });
    ratingLabel.append(ratingSelect);

    const editButtons = createTag("div", "manager-edit-actions");
    const saveButton = createTag("button", "", "Save changes");
    saveButton.type = "submit";
    const cancelButton = makeManagerButton("Cancel", "", () => { editArea.hidden = true; });
    editButtons.append(saveButton, cancelButton);
    editArea.append(nameLabel, reviewLabel, ratingLabel, editButtons);
    editArea.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!editArea.reportValidity()) return;
      review.name = nameInput.value.trim();
      review.text = reviewInput.value.trim();
      review.rating = Number(ratingSelect.value);
      const saved = saveReviews();
      byId("manager-status").textContent = saved ? "Sample review updated in this browser." : "Browser storage is unavailable; changes last only for this page view.";
      renderReviews();
      renderManager();
    });

    const editButton = makeManagerButton("Edit", "", () => { editArea.hidden = !editArea.hidden; if (!editArea.hidden) nameInput.focus(); });
    const toggleButton = makeManagerButton(
      review.status === "pending" ? "Approve" : "Hide",
      "",
      () => {
        review.status = review.status === "pending" ? "approved" : "pending";
        const saved = saveReviews();
        byId("manager-status").textContent = saved ? `Sample review ${review.status === "approved" ? "approved for the public demo" : "hidden from the public demo"} in this browser.` : "Browser storage is unavailable; the change lasts only for this page view.";
        renderReviews();
        renderManager();
      },
    );
    const removeButton = makeManagerButton("Remove", "remove-review", () => {
      reviews = reviews.filter((candidate) => candidate.id !== review.id);
      const saved = saveReviews();
      byId("manager-status").textContent = saved ? "Sample review removed from this browser's demo." : "Browser storage is unavailable; the change lasts only for this page view.";
      renderReviews();
      renderManager();
    });
    actions.append(editButton, toggleButton, removeButton);
    entry.append(summary, actions, editArea);
    managerQueue.append(entry);
  });
}

managerToggle?.addEventListener("click", () => {
  const isOpening = managerToggle.getAttribute("aria-expanded") !== "true";
  managerToggle.setAttribute("aria-expanded", String(isOpening));
  managerPanel.hidden = !isOpening;
  managerToggle.firstChild.textContent = isOpening ? "Close demo controls " : "Open demo controls ";
  renderManager();
  if (isOpening) managerPanel.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "nearest" });
});

renderReviews();
