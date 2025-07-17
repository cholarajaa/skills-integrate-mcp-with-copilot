document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  const searchInput = document.getElementById("search-input");
  const categoryFilter = document.getElementById("category-filter");
  const sortSelect = document.getElementById("sort-select");

  let allActivities = {};

  // Helper to get unique categories from activities
  function getCategories(activities) {
    const cats = new Set();
    Object.values(activities).forEach((a) => {
      if (a.category) cats.add(a.category);
    });
    return Array.from(cats);
  }

  // Render activities with filters, search, and sort
  function renderActivities() {
    let filtered = Object.entries(allActivities);

    // Filter by category
    const cat = categoryFilter ? categoryFilter.value : "";
    if (cat) {
      filtered = filtered.filter(([_, d]) => d.category === cat);
    }

    // Search by name/description
    const search = searchInput ? searchInput.value.trim().toLowerCase() : "";
    if (search) {
      filtered = filtered.filter(
        ([name, d]) =>
          name.toLowerCase().includes(search) ||
          (d.description && d.description.toLowerCase().includes(search))
      );
    }

    // Sort
    const sortBy = sortSelect ? sortSelect.value : "name";
    filtered.sort((a, b) => {
      if (sortBy === "name") {
        return a[0].localeCompare(b[0]);
      } else if (sortBy === "time") {
        // Assume time is in d.schedule or d.time
        return (a[1].schedule || a[1].time || "").localeCompare(b[1].schedule || b[1].time || "");
      }
      return 0;
    });

    // Render
    activitiesList.innerHTML = "";
    if (filtered.length === 0) {
      activitiesList.innerHTML = "<p>No activities found.</p>";
      return;
    }
    filtered.forEach(([name, details]) => {
      const activityCard = document.createElement("div");
      activityCard.className = "activity-card";

      const spotsLeft = details.max_participants - details.participants.length;

      const participantsHTML =
        details.participants.length > 0
          ? `<div class="participants-section">
              <h5>Participants:</h5>
              <ul class="participants-list">
                ${details.participants
                  .map(
                    (email) =>
                      `<li><span class="participant-email">${email}</span><button class="delete-btn" data-activity="${name}" data-email="${email}">❌</button></li>`
                  )
                  .join("")}
              </ul>
            </div>`
          : `<p><em>No participants yet</em></p>`;

      activityCard.innerHTML = `
        <h4>${name}</h4>
        <p>${details.description}</p>
        <p><strong>Schedule:</strong> ${details.schedule}</p>
        <p><strong>Category:</strong> ${details.category || "General"}</p>
        <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        <div class="participants-container">
          ${participantsHTML}
        </div>
      `;

      activitiesList.appendChild(activityCard);
    });

    // Add event listeners to delete buttons
    document.querySelectorAll(".delete-btn").forEach((button) => {
      button.addEventListener("click", handleUnregister);
    });
  }

  // Populate category filter
  function renderCategories() {
    if (!categoryFilter) return;
    const cats = getCategories(allActivities);
    categoryFilter.innerHTML = '<option value="">All Categories</option>' +
      cats.map(c => `<option value="${c}">${c}</option>`).join("");
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();
      allActivities = activities;
      renderCategories();
      renderActivities();
      // Populate activitySelect for signup
      if (activitySelect) {
        activitySelect.innerHTML = '<option value="">-- Select an activity --</option>' +
          Object.keys(activities).map(name => `<option value="${name}">${name}</option>`).join("");
      }
    } catch (error) {
      activitiesList.innerHTML =
        "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // ...existing code for handleUnregister...

  // ...existing code for signupForm submit handler...

  // Event listeners for filters/search/sort
  if (searchInput) searchInput.addEventListener("input", renderActivities);
  if (categoryFilter) categoryFilter.addEventListener("change", renderActivities);
  if (sortSelect) sortSelect.addEventListener("change", renderActivities);

  // Initialize app
  fetchActivities();
});
