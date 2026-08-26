const axios = require('axios');
const test = async () => {
  try {
    const res = await axios.post('http://localhost:5000/api/items', {
      type: 'lost',
      title: 'Test',
      category: 'Keys',
      location: 'Lib',
      description: 'Lost keys',
      image: 'some-url',
      user: '64d3b6f00123456789abcdef' // some dummy id
    });
    console.log("Success:", res.data);
  } catch (err) {
    console.log("Error:", err.response ? err.response.data : err.message);
  }
}
test();
