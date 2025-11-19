// public/client.js
// Handles form submit, password toggle, reset, success panel and toast.

(() => {
  const form = document.getElementById("regForm");
  const nameIn = document.getElementById("name");
  const emailIn = document.getElementById("email");
  const passIn = document.getElementById("password");
  const courseIn = document.getElementById("course");

  const pwToggle = document.getElementById("pwToggle");
  const resetBtn = document.getElementById("resetBtn");
  const submitBtn = document.getElementById("submitBtn");
  const btnText = submitBtn.querySelector(".btn-text");
  const loader = submitBtn.querySelector(".loader");

  const successPanel = document.getElementById("successPanel");
  const studentIdEl = document.getElementById("studentId");
  const studentNameEl = document.getElementById("studentName");
  const studentEmailEl = document.getElementById("studentEmail");
  const addAnotherBtn = document.getElementById("addAnother");

  const toast = document.getElementById("toast");
  const card = document.getElementById("card");

  // Utility: show toast
  function showToast(message, opts = {}) {
    toast.hidden = false;
    toast.textContent = message;
    toast.style.opacity = "1";
    toast.style.background = opts.error ? "linear-gradient(90deg,#ff4d4f,#ff7a7a)" : "linear-gradient(90deg,#059669,#10b981)";
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => {
      toast.style.opacity = "0";
      setTimeout(() => (toast.hidden = true), 300);
    }, opts.duration || 3500);
  }

  // Password toggle
  pwToggle.addEventListener("click", (e) => {
    e.preventDefault();
    const isVisible = passIn.type === "text";
    passIn.type = isVisible ? "password" : "text";
    pwToggle.textContent = isVisible ? "Show" : "Hide";
    pwToggle.setAttribute("aria-pressed", String(!isVisible));
    passIn.focus();
  });

  // Reset form UI + values
  resetBtn.addEventListener("click", () => {
    form.reset();
    // hide success panel if open
    hideSuccessPanel();
    // reset pw toggle if it was "Hide"
    if (passIn.type === "text") {
      passIn.type = "password";
      pwToggle.textContent = "Show";
      pwToggle.setAttribute("aria-pressed", "false");
    }
    showToast("Form reset", { duration: 1300 });
    nameIn.focus();
  });

  // Show success panel
  function showSuccessPanel({ id, name, email }) {
    studentIdEl.textContent = id || "—";
    studentNameEl.textContent = name || "—";
    studentEmailEl.textContent = email || "—";

    successPanel.hidden = false;
    successPanel.setAttribute("aria-hidden", "false");
    // hide the form visually (it remains in DOM)
    form.style.display = "none";

    // nice focus for keyboard users
    addAnotherBtn.focus();
  }

  function hideSuccessPanel() {
    successPanel.hidden = true;
    successPanel.setAttribute("aria-hidden", "true");
    form.style.display = ""; // revert to default
  }

  // Add another button to reset and show form again
  addAnotherBtn.addEventListener("click", () => {
    hideSuccessPanel();
    form.reset();
    if (passIn.type === "text") {
      passIn.type = "password";
      pwToggle.textContent = "Show";
      pwToggle.setAttribute("aria-pressed", "false");
    }
    nameIn.focus();
  });



  // Disable/Enable form during submit
  function setSubmitting(on) {
    if (on) {
      submitBtn.disabled = true;
      resetBtn.disabled = true;
      [...form.elements].forEach((el) => (el.disabled = true));
      loader.style.display = "inline-block";
      btnText.style.opacity = "0";
    } else {
      submitBtn.disabled = false;
      resetBtn.disabled = false;
      [...form.elements].forEach((el) => (el.disabled = false));
      loader.style.display = "none";
      btnText.style.opacity = "1";
    }
  }

  // Helper to extract ID from various server response shapes
  function extractId(body) {
    if (!body) return null;
    if (body.student && (body.student.id || body.student._id)) {
      return body.student.id || body.student._id;
    }
    if (body._id) return body._id;
    if (body.id) return body.id;
    if (body.studentId) return body.studentId;
    return null;
  }

  // Submit handler
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Basic client-side validation
    const name = nameIn.value.trim();
    const email = emailIn.value.trim();
    const password = passIn.value;
    const course = courseIn.value.trim();

    if (!name || !email || !password) {
      showToast("Name, email and password are required", { error: true });
      return;
    }
    if (password.length < 6) {
      showToast("Password must be at least 6 characters", { error: true });
      return;
    }

    // Prepare payload
    const payload = { name, email, password, course };

    try {
      setSubmitting(true);
      showToast("Registering…");

      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        // Atlas / server may return { error: "…" } or { message: "…" }
        const message = body.error || body.message || "Registration failed";
        showToast(message, { error: true });
        setSubmitting(false);
        return;
      }

      // success — attempt to find ID and display details
      const id = extractId(body) || body.studentId || body.id || "—";
      const returnedName =
        (body.student && body.student.name) || name || body.name || "—";
      const returnedEmail =
        (body.student && body.student.email) || email || body.email || "—";

      // small delay to let loader be visible
      setTimeout(() => {
        setSubmitting(false);
        showToast("Registration successful!", { duration: 1600 });
        showSuccessPanel({ id, name: returnedName, email: returnedEmail });
      }, 600);
    } catch (err) {
      console.error("Submit error:", err);
      showToast("Network error — could not register", { error: true });
      setSubmitting(false);
    }
  });

  // initialize: hide loader
  loader.style.display = "none";

  // keyboard: toggle pw with Ctrl+M as a convenience (optional)
  document.addEventListener("keydown", (ev) => {
    if (ev.ctrlKey && ev.key.toLowerCase() === "m") {
      pwToggle.click();
    }
  });

  // Accessibility helpers
  pwToggle.setAttribute("role", "switch");
  pwToggle.setAttribute("aria-pressed", "false");

  // Expose some methods for debugging in console (optional)
  window._studentUI = {
    showToast,
    showSuccessPanel,
    hideSuccessPanel,
  };
})();
