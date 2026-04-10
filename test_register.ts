import fetch from "node-fetch";

async function test() {
  const res = await fetch("http://localhost:3000/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fullName: "Test Lawyer",
      mobile: "01711111111",
      email: "testlawyer@example.com",
      password: "password123",
      userType: "lawyer",
      district: "ঢাকা",
      country: "Bangladesh"
    })
  });
  const data = await res.json();
  console.log(data);
}
test();
