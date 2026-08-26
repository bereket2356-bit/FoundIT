import re

with open("app/(tabs)/post.tsx", "r") as f:
    content = f.read()

content = content.replace('Alert.alert("Error", "Could not post item.");', 'Alert.alert("Error", error.response?.data?.message || "Could not post item.");')

with open("app/(tabs)/post.tsx", "w") as f:
    f.write(content)
