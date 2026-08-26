import re

with open("app/(tabs)/post.tsx", "r") as f:
    content = f.read()

# Replace validation logic
old_validation = """    if (!title || !category || !location || !date || !description || !image) {
      Alert.alert("Missing Fields", "Please fill in all fields.");
      return;
    }"""
new_validation = """    // date is optional for lost items
    if (!title || !category || !location || !description || !image) {
      Alert.alert("Missing Fields", "Please fill in all required fields.");
      return;
    }
    if (type === "found" && !date) {
      Alert.alert("Missing Fields", "Please provide a Date Found.");
      return;
    }
    
    // Check date format if provided
    let finalDate = date;
    if (date) {
      const parsed = Date.parse(date);
      if (isNaN(parsed)) {
        Alert.alert("Invalid Date", "Please enter a valid date (e.g. YYYY-MM-DD).");
        return;
      }
      finalDate = new Date(parsed).toISOString();
    } else {
      finalDate = null;
    }"""

content = content.replace(old_validation, new_validation)

# Now replace the date in the payload
content = content.replace("          date,", "          date: finalDate,")

# Also update the UI placeholder
old_ui = """        {/* Date */}
        <TextInput
          placeholder="Date (YYYY-MM-DD)"
          placeholderTextColor="#aaa"
          style={styles.input}
          value={date}
          onChangeText={setDate}
        />"""
new_ui = """        {/* Date */}
        <TextInput
          placeholder={type === "lost" ? "Date Lost (Optional, YYYY-MM-DD)" : "Date Found (YYYY-MM-DD)"}
          placeholderTextColor="#aaa"
          style={styles.input}
          value={date}
          onChangeText={setDate}
        />"""
content = content.replace(old_ui, new_ui)

with open("app/(tabs)/post.tsx", "w") as f:
    f.write(content)
