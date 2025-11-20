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
              propertyName: "name",
              operator: "CONTAINS_TOKEN",
              value: q
            }
          ]
        }
      ],
      properties: ["name", "city", "domain"],
      limit: 10
    };

    const results = await hubspotClient.crm.companies.searchApi.doSearch(searchBody);
    const companies = (results.results || []).map(c => ({
      id: c.id,
      name: c.properties?.name || "",
      city: c.properties?.city || "",
      domain: c.properties?.domain || ""
    }));

    return {
      statusCode: 200,
      body: JSON.stringify({ companies })
    };
  } catch (err) {
    console.error("searchCompanies error:", err.message || err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "server_error" })
    };
  }
};
