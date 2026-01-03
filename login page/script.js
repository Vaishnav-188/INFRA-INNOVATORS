document.getElementById("loginForm").addEventListener("submit", function(e) {
  e.preventDefault();

  const userType = document.getElementById("userType").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  if (!userType) {
    alert("Please select your user type!");
    return;
  }

  // Simple demo validation (you can replace with backend logic later)
  const users = {
    admin: { email: "admin@alumni.com", password: "admin123" },
    student: { email: "student@college.com", password: "student123" },
    alumni: { email: "alumni@college.com", password: "alumni123" }
  };

  if (email === users[userType].email && password === users[userType].password) {
    alert(`${userType.charAt(0).toUpperCase() + userType.slice(1)} Login Successful!`);
    // Redirect based on user type
    if (userType === "admin") window.location.href = "admin-dashboard.html";
    else if (userType === "student") window.location.href = "student-dashboard.html";
    else window.location.href = "alumni-dashboard.html";
  } else {
    alert("Invalid email or password!");
  }
});
