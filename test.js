const https = require('https');
https.get('https://raw.githubusercontent.com/paypal/paypal-checkout-components/main/docs/hosted-buttons.md', res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log(data));
});
