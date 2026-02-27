const express = require('express');
const cors = require('cors');
const nodePrinter = require('printer');
const { printer: ThermalPrinter, types: PrinterTypes } = require('node-thermal-printer');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Endpoint to list available printers on the OS (useful for debugging)
app.get('/printers', (req, res) => {
    try {
        const printers = nodePrinter.getPrinters();
        res.json(printers);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/print', (req, res) => {
    const { shopName, address, phone, items, totals, printerName } = req.body;

    if (!shopName || !items || !totals) {
        return res.status(400).json({ error: "Missing required print data." });
    }

    // Use provided printer name or fallback to system default
    let targetPrinter = printerName || nodePrinter.getDefaultPrinterName();

    // macOS/Linux Fix: If default printer name contains spaces or special characters
    if (!targetPrinter && process.platform !== 'win32') {
        const printers = nodePrinter.getPrinters();
        if (printers.length > 0) {
            // Find the first printer that looks like a POS/Thermal printer
            const posPrinter = printers.find(p => p.name.toLowerCase().includes('pos') || p.name.toLowerCase().includes('58'));
            targetPrinter = posPrinter ? posPrinter.name : printers[0].name;
        }
    }

    if (!targetPrinter) {
        return res.status(500).json({ error: "No printer found. Please ensure the printer is connected and added in System Settings." });
    }

    console.log(`Attempting to print to: ${targetPrinter}`);

    try {
        let printer = new ThermalPrinter({
            type: PrinterTypes.EPSON, // Use EPSON for generic ESC/POS printers
            interface: `printer:${targetPrinter}`,
            driver: nodePrinter,
            width: 28, // Adjusted for 48mm printable area
            characterSet: 'PC437_USA',
            removeSpecialCharacters: false,
            lineCharacter: "-"
        });

        // --- Receipt Layout ---
        const { date, time, subFooter } = req.body;
        const currentDate = date || new Date().toLocaleDateString();
        const currentTime = time || new Date().toLocaleTimeString();
        
        // Header
        printer.alignCenter();
        printer.bold(true);
        printer.setTextDoubleHeight();
        printer.setTextDoubleWidth();
        printer.println(shopName.toUpperCase());
        printer.setTextNormal();
        printer.bold(false);
        
        printer.println(address.toUpperCase());
        printer.println(phone.toUpperCase());
        printer.println("- ".repeat(14).trim());
        printer.println("CASH RECEIPT");
        printer.println("- ".repeat(14).trim());

        // Info
        printer.alignLeft();
        printer.println(`DATE: ${currentDate} ${currentTime}`);
        printer.println("RCPT: #TM-882910");
        printer.println("CASHIER: 01 (ADMIN)");
        printer.drawLine();

        // Items Header
        printer.tableCustom([
            { text: "QTY ITEM", align: "LEFT", width: 0.7 },
            { text: "TOTAL", align: "RIGHT", width: 0.3 }
        ]);
        printer.drawLine();

        // Items
        items.forEach(item => {
            const itemName = (item.name || item.desc || "ITEM").toUpperCase();
            const itemPrice = parseFloat(item.price || 0);
            const itemQty = parseInt(item.quantity || 1);
            const itemSubtotal = (itemPrice * itemQty).toFixed(2);
            
            // Line 1: QTY NAME and TOTAL
            printer.tableCustom([
                { text: `${itemQty} ${itemName.substring(0, 14)}`, align: "LEFT", width: 0.7 },
                { text: itemSubtotal, align: "RIGHT", width: 0.3 }
            ]);
            // Line 2: Indented Unit Price
            printer.println(`  @ ${itemPrice.toFixed(2)}`);
        });
        printer.println("- ".repeat(14).trim());

        // Calculations
        printer.tableCustom([
            { text: "SUBTOTAL", align: "LEFT", width: 0.5 },
            { text: totals.total, align: "RIGHT", width: 0.5 }
        ]);
        printer.tableCustom([
            { text: "TAX (0.0%)", align: "LEFT", width: 0.5 },
            { text: "0.00", align: "RIGHT", width: 0.5 }
        ]);
        
        printer.bold(true);
        printer.setTextDoubleHeight();
        printer.tableCustom([
            { text: "TOTAL", align: "LEFT", width: 0.5 },
            { text: totals.total, align: "RIGHT", width: 0.5 }
        ]);
        printer.setTextNormal();
        printer.bold(false);
        printer.println("- ".repeat(16).trim());

        // Payment Info
        if (totals.cash) {
            printer.tableCustom([
                { text: "TENDER: CASH", align: "LEFT", width: 1.0 }
            ]);
        }
        printer.println("");

        // Footer
        printer.alignCenter();
        printer.println("*** THANK YOU ***");
        printer.println("RETURNS ACCEPTED WITHIN");
        printer.println("30 DAYS WITH RECEIPT");
        printer.println("");
        printer.println("882910394812");
        printer.newLine();
        printer.newLine();
        
        printer.cut();

        // Execute the print job
        printer.execute().then(() => {
            console.log("Print job sent to spooler.");
            res.json({ success: true, message: "Receipt sent to printer." });
        }).catch((error) => {
            console.error("Printing failed:", error);
            res.status(500).json({ error: "Printing failed: " + error.message });
        });

    } catch (error) {
        console.error("Setup failed:", error);
        res.status(500).json({ error: "Printer setup failed: " + error.message });
    }
});

app.listen(PORT, () => {
    console.log(`🖨️  Print server running on http://localhost:${PORT}`);
    console.log(`Default System Printer: ${nodePrinter.getDefaultPrinterName() || 'None'}`);
});
