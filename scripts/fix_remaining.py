import re

# Fix signup.tsx
with open("app/(auth)/signup.tsx", "r") as f:
    content = f.read()
if "useAlert" not in content:
    content = content.replace('import { API_URL } from "../../constants/api";', 'import { API_URL } from "../../constants/api";\nimport { useAlert } from "../../context/AlertContext";')
if "const { showAlert } = useAlert();" not in content:
    content = content.replace('const router = useRouter();', 'const router = useRouter();\n  const { showAlert } = useAlert();')

with open("app/(auth)/signup.tsx", "w") as f:
    f.write(content)

# Fix post.tsx errors
with open("app/(tabs)/post.tsx", "r") as f:
    content = f.read()

# fix `finalDate = null` (Type 'null' is not assignable to type 'string') -> change finalDate type or just `null as any`
content = content.replace("let finalDate = date;", "let finalDate: string | null = date;")
# fix `error.response?.data?.message` which throws TS18046: 'error' is of type 'unknown'
content = content.replace("error.response?.data?.message", "(error as any).response?.data?.message")

with open("app/(tabs)/post.tsx", "w") as f:
    f.write(content)
