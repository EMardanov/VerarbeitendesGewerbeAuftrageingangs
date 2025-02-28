import fs from 'fs';

const API_URL = "https://www-genesis.destatis.de/genesisWS/rest/2020/data/table";
const PARAMS = {
    username: "elchinmardanov@yahoo.com",   // Replace with actual username
    password: "Elchin774411!",   // Replace with actual password
    name: "42151-0004",
    compress: "false",
    classifyingvariable1: "WZ08Y1",
    classifyingkey1: "WZ08-C",
    classifyingvariable2: "WERT03",
    classifyingkey2: "X13JDKSB",
    startyear: "2022",
    endyear: "2024",
    timeslices: "3",
    format: "json",
    language: "de",
    classifyingvariable3: "MONAT",
    classifyingkey3: "MONAT05,MONAT06,MONAT09,MONAT12",
    classifyingvariable4: "ABSATZ",
    classifyingkey4: "INSGESAMT"
};

const buildQueryString = (params) => {
    return new URLSearchParams(params).toString();
};

const fetchData = async () => {
    const url = `${API_URL}?${buildQueryString(PARAMS)}`;

    try {
        console.log("\n🔍 Fetching data from Destatis Genesis API...");
        const response = await fetch(url, { method: "GET" });

        if (!response.ok) {
            throw new Error(`❌ HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        console.log("\n✅ Data fetched successfully!\n");

        if (data.Object && data.Object.Content) {
            console.log("\n📜 Raw Data Content:\n");
            console.log(data.Object.Content); // Print raw content to see its structure

            // Extract and format the useful parts
            const formattedData = parseTableData(data.Object.Content);
            console.log("\n📊 Extracted Data:\n", formattedData);

            // Create JSON object with both raw & parsed data
            const combinedData = {
                //raw_data: data,  // Full raw API response
                parsed_data: formattedData // Extracted structured data
            };

            // Save combined data to JSON
            fs.writeFileSync("destatis_combined_data.json", JSON.stringify(combinedData, null, 4));
            console.log("\n📂 Data saved to destatis_combined_data.json\n");
        } else {
            console.error("\n❌ Unexpected data format received.");
        }
    } catch (error) {
        console.error("\n❌ Error fetching data:", error.message);
    }
};

// Function to parse and extract useful information from the text content
const parseTableData = (textContent) => {
    const lines = textContent.split("\n"); // Split content into lines
    const extractedData = [];

    lines.forEach((line) => {
        const parts = line.split(";"); // Split by semicolon (CSV-like format)

        // Extract relevant data (e.g., Verarbeitendes Gewerbe;2022;September;91,4)
        if (parts.length >= 4) {
            const sector = parts[0].trim();
            const year = parts[1].trim();
            const month = parts[2].trim();
            let indexValue = parts[3].trim();

            // Convert German decimal format (comma) to standard format (dot)
            if (indexValue.includes(",")) {
                indexValue = indexValue.replace(",", ".");
            }

            // Parse as a floating-point number
            const index = parseFloat(indexValue);

            if (!isNaN(index)) {
                extractedData.push({
                    sector,
                    year,
                    month,
                    index
                });
            }
        }
    });

    return extractedData;
};

// Run the fetch function
fetchData();
