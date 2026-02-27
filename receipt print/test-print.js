const http = require('http');

const payload = JSON.stringify({
    shopName: "FIN OPEN POS TEST",
    address: "123 Test Avenue, Suite 100",
    phone: "555-0199",
    date: new Date().toLocaleDateString(),
    time: new Date().toLocaleTimeString(),
    items: [
        { name: "Test Product 1", quantity: 2, price: 10.00 },
        { name: "Long Product Name Example", quantity: 1, price: 5.50 },
        { name: "Small Item", quantity: 3, price: 12.99 }
    ],
    totals: {
        total: "64.47",
        cash: "100.00",
        change: "35.53"
    },
    subFooter: "Test Print Successful"
});

const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/print',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
    }
};

console.log("Sending print request...");

const req = http.request(options, (res) => {
    console.log(`Status Code: ${res.statusCode}`);
    
    res.on('data', (d) => {
        process.stdout.write(d);
        console.log("\n");
    });
});

req.on('error', (error) => {
    console.error("Error sending request:", error.message);
    console.log("Make sure server.js is running on port 3001!");
});

req.write(payload);
req.end();