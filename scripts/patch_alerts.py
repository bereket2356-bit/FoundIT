import os
import re

files = [
    "app/(auth)/login.tsx",
    "app/(auth)/signup.tsx",
    "app/(tabs)/post.tsx",
    "app/(tabs)/home.tsx",
]

for file in files:
    with open(file, "r") as f:
        content = f.read()
    
    # 1. Add import for useAlert
    if "useAlert" not in content:
        if "login" in file or "signup" in file:
            content = content.replace('import { useUser } from "../../context/Usercontext";', 'import { useUser } from "../../context/Usercontext";\nimport { useAlert } from "../../context/AlertContext";')
        else:
            content = content.replace('import { useUser } from "../../context/Usercontext";', 'import { useUser } from "../../context/Usercontext";\nimport { useAlert } from "../../context/AlertContext";')

    # 2. Add hook call
    if "const { showAlert } = useAlert();" not in content:
        content = content.replace('const { updateUser } = useUser();', 'const { updateUser } = useUser();\n  const { showAlert } = useAlert();')
        content = content.replace('const { user } = useUser();', 'const { user } = useUser();\n  const { showAlert } = useAlert();')
    
    # 3. Replace Alert.alert
    # Format: Alert.alert("Title", "Message" or variable)
    def repl_alert(m):
        title = m.group(1).strip()
        msg = m.group(2).strip()
        # Guess type
        t = "info"
        if "error" in title.lower() or "missing" in title.lower() or "invalid" in title.lower():
            t = "error"
        
        return f"showAlert({{ title: {title}, message: {msg}, type: '{t}' }})"
    
    content = re.sub(r'Alert\.alert\(([^,]+),\s*([\s\S]+?)\)(;?)', repl_alert, content)

    # 4. Remove SuccessModal imports and state
    content = re.sub(r'import SuccessModal from ".*?";\n', '', content)
    content = re.sub(r'const \[showSuccess, setShowSuccess\] = useState\(false\);\n', '', content)
    content = re.sub(r'<SuccessModal[\s\S]*?/>', '', content)

    # 5. Replace setShowSuccess(true) with showAlert
    if "login" in file:
        success_call = """showAlert({
                  type: 'success',
                  title: 'You are now logged in',
                  message: 'Welcome back to FoundIT.',
                  buttonText: 'Continue',
                  onPress: () => router.replace('/(tabs)/home')
                });"""
        content = content.replace('setShowSuccess(true);', success_call)
    elif "signup" in file:
        success_call = """showAlert({
                  type: 'success',
                  title: 'Account Created Successfully',
                  message: 'You can now log in to FoundIT.',
                  buttonText: 'Continue',
                  onPress: () => router.replace('/(auth)/login')
                });"""
        content = content.replace('setShowSuccess(true);', success_call)
    elif "post" in file:
        success_call = """showAlert({
                  type: 'success',
                  title: 'Form Submitted',
                  message: 'Wait for admin review.',
                  buttonText: 'Continue',
                  onPress: () => router.replace('/(tabs)/home')
                });"""
        content = content.replace('setShowSuccess(true);', success_call)
    elif "home" in file:
        success_call = """showAlert({
                  type: 'success',
                  title: 'Form Submitted',
                  message: 'Wait for admin review.',
                  buttonText: 'Continue',
                });"""
        content = content.replace('setShowSuccess(true);', success_call)

    with open(file, "w") as f:
        f.write(content)

