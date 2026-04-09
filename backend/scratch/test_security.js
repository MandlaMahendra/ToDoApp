// No need for node-fetch in Node 18+


async function testSecurity() {
  const baseUrl = "http://localhost:5000/api/todos";
  
  console.log("Testing unauthorized GET...");
  try {
    const res = await fetch(baseUrl);
    console.log("Status:", res.status);
    const data = await res.json();
    console.log("Data:", data);
  } catch (err) {
    console.error("Error:", err.message);
  }

  console.log("\nTesting login and authorized GET...");
  try {
    const loginRes = await fetch("http://localhost:5000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "mandlamahendravalmiki@gmail.com", password: "Password123" }) // I need to know the password or create a new user
    });
    
    if (loginRes.ok) {
        const { token } = await loginRes.json();
        console.log("Login successful. Token obtained.");
        const authRes = await fetch(baseUrl, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log("Authorized Status:", authRes.status);
        const authData = await authRes.json();
        console.log("Authorized Data length:", authData.length);
    } else {
        console.log("Login failed. Trying registration...");
        const regRes = await fetch("http://localhost:5000/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: "Test User", email: "test_sec@example.com", password: "Password123" })
        });
        console.log("Registration status:", regRes.status);
        // Now login
        const loginRes2 = await fetch("http://localhost:5000/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: "test_sec@example.com", password: "Password123" })
        });
        const { token } = await loginRes2.json();
        const authRes = await fetch(baseUrl, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log("Authorized Status (new user):", authRes.status);
        const authData = await authRes.json();
        console.log("Authorized Data (new user):", authData);
    }
  } catch (err) {
    console.error("Error:", err.message);
  }
}

testSecurity();
