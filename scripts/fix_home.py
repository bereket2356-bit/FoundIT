import re

with open("app/(tabs)/home.tsx", "r") as f:
    content = f.read()

# Fix 1: showAlert({ title: "Permission required!");
content = content.replace('showAlert({ title: "Permission required!");', 'showAlert({ title: "Permission required", message: "Sorry, we need camera roll permissions to make this work!", type: "error" });')

# Fix 2: mediaTypes: ["images"], message: allowsEditing: true, -> mediaTypes: ["images"], allowsEditing: true,
content = content.replace('message: allowsEditing: true,', 'allowsEditing: true,')
content = content.replace('}, type: \'info\' })', '});')

# Fix 3: ,, type: 'error'
content = content.replace(",, type: 'error'", ", type: 'error'")
content = content.replace(",, type: 'info'", ", type: 'info'")

with open("app/(tabs)/home.tsx", "w") as f:
    f.write(content)
