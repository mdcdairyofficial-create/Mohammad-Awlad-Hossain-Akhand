import fetch from "node-fetch";

async function test() {
  const res = await fetch("http://localhost:3000/api/auth/google", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fullName: "Google Lawyer",
      email: "googlelawyer@example.com",
      profilePicture: "",
      userType: "lawyer",
      district: "ঢাকা",
      country: "Bangladesh"
    })
  });
  const data = await res.json();
  console.log(data);
}
test();
