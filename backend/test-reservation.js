async function test() {
  console.log("=== Testing Register Endpoint ===");
  
  try {
    const res = await fetch('http://localhost:5000/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nom: "Test User",
        email: "test@example.com",
        matricule: "MAT-TEST-0011",
        mot_de_passe: "password123",
        role: "ADMIN"
      })
    });
    const data = await res.json();
    console.log("HTTP STATUS:", res.status);
    console.log("RESPONSE:", JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("FETCH ERROR:", err.message);
  }
}
test();
