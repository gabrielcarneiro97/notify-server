const axios = require('axios');

axios.get('https://localhost:8181/hello').then(res => console.log(res.data));
