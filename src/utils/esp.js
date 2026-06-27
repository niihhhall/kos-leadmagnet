export const submitLeadToESP = async (leadData) => {
  // Simulate network request latency (600ms)
  await new Promise((resolve) => setTimeout(resolve, 600));

  // Log payload with premium visual formatting
  console.log(
    `%c[ESP Mock Service]%c Lead Captured:\nEmail: ${leadData.email}\nScore: ${leadData.score}/60\nProfession: ${leadData.profession}\nClients: ${leadData.clientCount}`,
    "color: #ff751f; font-weight: bold; font-size: 14px;",
    "color: #fffff5; font-size: 12px; background: #292929; padding: 6px; border-radius: 4px;"
  );

  // Persist locally for validation
  const storedLeads = JSON.parse(localStorage.getItem("leads") || "[]");
  storedLeads.push({
    ...leadData,
    timestamp: new Date().toISOString(),
  });
  localStorage.setItem("leads", JSON.stringify(storedLeads));

  return { success: true };
};
