const fs = require('fs');
const jsQR = require('jsqr');
const jpeg = require('jpeg-js');

const jpegData = fs.readFileSync('/Users/axel/Documents/asesur/frontend/public/qr.jpeg');
const rawImageData = jpeg.decode(jpegData, {useTArray: true});
const code = jsQR(rawImageData.data, rawImageData.width, rawImageData.height);

if (code) {
  console.log("QR Content:", code.data);
} else {
  console.log("Could not decode QR code.");
}
