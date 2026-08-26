import re

# Fix post.tsx
with open("app/(tabs)/post.tsx", "r") as f:
    content = f.read()

# I see it replaced it with: showAlert({ title: "Invalid Date", message: "Please enter a valid date (e.g. YYYY-MM-DD, type: 'error' }).");
content = content.replace('showAlert({ title: "Invalid Date", message: "Please enter a valid date (e.g. YYYY-MM-DD, type: \'error\' }).");', 'showAlert({ title: "Invalid Date", message: "Please enter a valid date (e.g. YYYY-MM-DD).", type: \'error\' });')
content = content.replace('showAlert({ title: "Missing Fields", message: "Please fill in all required fields.", type: \'error\' });', 'showAlert({ title: "Missing Fields", message: "Please fill in all required fields.", type: \'error\' });') # maybe this one is correct

with open("app/(tabs)/post.tsx", "w") as f:
    f.write(content)

# For home.tsx, since it was heavily modified by regex, I will just rewrite it to remove Alert.alert properly.
