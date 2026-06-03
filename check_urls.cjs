const https = require('https');
const files = ['S2600018', 'S2600019', 'S2600020', 'S2600021'];
files.forEach(f => {
  https.get(`https://brew-insights.web.app/Datos%20semanales/${f}.DBF`, res => {
    console.log(`${f}: ${res.statusCode} ${res.headers['content-type']}`);
  });
});
