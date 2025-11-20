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

    const searchBody = {
      filterGroups: [
        {
          filters: [
            {
              propertyName: "email",
              operator: "CONTAINS_TOKEN",
              value: q
            }
          ]
        }
      ],
      properties: ["firstname", "lastname", "email"],
      limit: 10
    };

    const results = await hubspotClient.crm.contacts.searchApi.doSearch(searchBody);
    const contacts = (results.results || []).map(c => ({
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
