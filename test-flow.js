import fetch from "node-fetch";

async function run() {
  const signupRes = await fetch("http://localhost:5173/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      firstName: "Test",
      lastName: "Mother",
      email: `testmother_${Date.now()}@gmail.com`,
      password: "demopassword123",
      hospitalId: "ELR",
      careStage: "pregnant",
      gestationalWeeks: 12,
      phone: "+1 5550100"
    })
  });

  const signupBody = await signupRes.json();
  console.log("SIGNUP STATUS:", signupRes.status);
  console.log("SIGNUP RESPONSE:", JSON.stringify(signupBody, null, 2));

  if (!signupRes.ok) {
    console.error("Signup failed!");
    return;
  }

  const token = signupBody.token;

  const onboardingRes = await fetch("http://localhost:5173/api/onboarding/complete", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({
      age: 28,
      phone: "+1 5550100",
      email: signupBody.user.email,
      bloodGroup: "O+",
      allergies: "None",
      emergencyContact: "John Mother (+1 5550101)",
      edd: "2027-01-01",
      gestationalWeeks: 12,
      careStage: "pregnant",
      concerns: "Nausea"
    })
  });

  const onboardingBody = await onboardingRes.json();
  console.log("ONBOARDING STATUS:", onboardingRes.status);
  console.log("ONBOARDING RESPONSE:", JSON.stringify(onboardingBody, null, 2));
}

run().catch(console.error);
