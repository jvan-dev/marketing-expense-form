const { Client } = require("@hubspot/api-client");

exports.handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const q = (event.queryStringParameters.q || "").trim();
    if (!q) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing query" }) };
    }

    const hubspotClient = new Client({
      accessToken: process.env.HUBSPOT_PRIVATE_APP_TOKEN
    });

    // If query has a space → treat as first + last
    const parts = q.split(/\s+/);
    const first = parts[0];
    const last = parts.length > 1 ? parts[parts.length - 1] : null;

    const filterGroups = [];

    if (first && last) {
      // Exact-ish full name: firstname AND lastname
      filterGroups.push({
        filters: [
          { propertyName: "firstname", operator: "CONTAINS_TOKEN", value: first },
          { propertyName: "lastname", operator: "CONTAINS_TOKEN", value: last }
        ]
      });
    }

    // First name contains q
    filterGroups.push({
      filters: [
        { propertyName: "firstname", operator: "CONTAINS_TOKEN", value: q }
      ]
    });

    // Last name contains q
    filterGroups.push({
      filters: [
        { propertyName: "lastname", operator: "CONTAINS_TOKEN", value: q }
      ]
    });

    // Email contains q
    filterGroups.push({
      filters: [
        { propertyName: "email", operator: "CONTAINS_TOKEN", value: q }
      ]
    });

    const searchBody = {
      filterGroups,
      properties: ["firstname", "lastname", "email"],
      limit: 10
    };

    const results = await hubspotClient.crm.contacts.searchApi.doSearch(searchBody);

    const contacts = (results.results || []).map((c) => ({
      id: c.id,
      firstname: c.properties?.firstname || "",
      lastname: c.properties?.lastname || "",
      email: c.properties?.email || ""
    }));

    return {
      statusCode: 200,
      body: JSON.stringify({ contacts })
    };
  } catch (err) {
    console.error("searchContacts error:", err.message || err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "server_error" })
    };
  }
};
