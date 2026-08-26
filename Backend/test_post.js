const axios = require('axios');
axios.post('http://localhost:5000/api/items', {
    type: 'found',
    title: 'Test',
    category: 'Test',
    location: 'Test',
    date: '', // missing date
    description: 'Test',
    image: 'Test',
    user: '64d60c2394c8b820a4b3b890'
}).catch(e => console.log(e.response?.data || e.message));
