with open("app/_layout.tsx", "r") as f:
    content = f.read()

content = content.replace('import { UserProvider } from "../context/Usercontext";', 'import { UserProvider } from "../context/Usercontext";\nimport { AlertProvider } from "../context/AlertContext";')

content = content.replace('<UserProvider>', '<UserProvider>\n        <AlertProvider>')
content = content.replace('</UserProvider>', '      </AlertProvider>\n      </UserProvider>')

with open("app/_layout.tsx", "w") as f:
    f.write(content)
