import re

with open("app/(tabs)/post.tsx", "r") as f:
    content = f.read()

# Add state
if "const [date, setDate] = useState" not in content:
    content = content.replace('const [location, setLocation] = useState("");', 'const [location, setLocation] = useState("");\n  const [date, setDate] = useState("");')

# Add to submit validation
content = content.replace('if (!title || !category || !location || !description || !image) {', 'if (!title || !category || !location || !date || !description || !image) {')

# Add to payload
content = content.replace('location,\n          description,', 'location,\n          date,\n          description,')

# Clear form
content = content.replace('setLocation("");', 'setLocation("");\n      setDate("");')

# Add UI input after location
location_ui = """        {/* Location */}
        <TextInput
          placeholder="Location"
          placeholderTextColor="#aaa"
          style={styles.input}
          value={location}
          onChangeText={setLocation}
        />"""

date_ui = """
        {/* Date */}
        <TextInput
          placeholder="Date (YYYY-MM-DD)"
          placeholderTextColor="#aaa"
          style={styles.input}
          value={date}
          onChangeText={setDate}
        />"""

content = content.replace(location_ui, location_ui + date_ui)

with open("app/(tabs)/post.tsx", "w") as f:
    f.write(content)

