import re

# 1. Fix auth paths
for file in ["app/(auth)/login.tsx", "app/(auth)/signup.tsx"]:
    with open(file, "r") as f:
        content = f.read()
    content = content.replace("../../components/SuccessModal", "../components/SuccessModal")
    with open(file, "w") as f:
        f.write(content)

# 2. Fix post.tsx state
with open("app/(tabs)/post.tsx", "r") as f:
    content = f.read()

# I see it missed adding the useState
if "const [date, setDate] = useState" not in content:
    content = content.replace("const [location, setLocation] = useState<string>(\"\");", "const [location, setLocation] = useState<string>(\"\");\n  const [date, setDate] = useState<string>(\"\");")
    content = content.replace("const [location, setLocation] = useState(\"\");", "const [location, setLocation] = useState(\"\");\n  const [date, setDate] = useState(\"\");")

with open("app/(tabs)/post.tsx", "w") as f:
    f.write(content)
