import fetch from "node-fetch";

async function test() {
  const res = await fetch("http://localhost:3000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      mobile: "01711111111",
      rawMobile: "01711111111",
      password: "password123"
    })
  });
  const data = await res.json();
  console.log(data);
}
test();
