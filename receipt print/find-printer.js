const usb = require('usb');

const devices = usb.getDeviceList();

console.log("--------------------------------------------------");
console.log("Scanning USB Devices...");
console.log("--------------------------------------------------");

devices.forEach((device) => {
    const descriptor = device.deviceDescriptor;
    // Convert decimal to Hex (e.g., 1155 -> 0x0483)
    const vid = '0x' + descriptor.idVendor.toString(16).toUpperCase().padStart(4, '0');
    const pid = '0x' + descriptor.idProduct.toString(16).toUpperCase().padStart(4, '0');
    
    console.log(`Device: VID ${vid} | PID ${pid}`);
});

console.log("--------------------------------------------------");
console.log("To identify your printer:");
console.log("1. Unplug the printer.");
console.log("2. Run this script: node find-printer.js");
console.log("3. Plug the printer back in.");
console.log("4. Run this script again.");
console.log("The NEW entry that appears is your printer.");