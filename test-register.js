async function test() {
  try {
    const res = await fetch('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: "Test User",
        mobile: "01700000001",
        email: "test@example.com",
        password: "password123",
        userType: "client",
        district: "Dhaka",
        country: "Bangladesh",
        referredBy: ""
      })
    });
    const data = await res.json();
    console.log("Status:", res.status);
    console.log("Response:", data);
  } catch (e) {
    console.error(e);
  }
}
test();
