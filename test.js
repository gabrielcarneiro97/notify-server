const axios = require('axios');

axios.get('localhost:8181/hello').then(res => console.log(res.data));
