import re

# PATCH LOGIN
with open("app/(auth)/login.tsx", "r") as f:
    content = f.read()

if "SuccessModal" not in content:
    content = content.replace("import { Ionicons } from \"@expo/vector-icons\";", "import { Ionicons } from \"@expo/vector-icons\";\nimport SuccessModal from \"../../components/SuccessModal\";")
    # also add it to top if no Ionicon
    if "SuccessModal" not in content:
        content = "import SuccessModal from \"../../components/SuccessModal\";\n" + content

if "showSuccess" not in content:
    content = content.replace("const [password, setPassword] = useState(\"\");", "const [password, setPassword] = useState(\"\");\n  const [showSuccess, setShowSuccess] = useState(false);")

# Update success alert
content = content.replace('Alert.alert("Success", "You are now logged in!");', "setShowSuccess(true);")
content = content.replace('router.replace("/(tabs)/home");', '')

modal_code = """      <SuccessModal
        visible={showSuccess}
        title="You are now logged in"
        description="Welcome back to FoundIT."
        buttonLabel="Continue"
        onPressButton={() => {
          setShowSuccess(false);
          router.replace("/(tabs)/home");
        }}
      />
    </SafeAreaView>"""

content = content.replace("    </SafeAreaView>\n  );\n}\n", modal_code + "\n  );\n}\n")

with open("app/(auth)/login.tsx", "w") as f:
    f.write(content)


# PATCH SIGNUP
with open("app/(auth)/signup.tsx", "r") as f:
    content = f.read()

if "SuccessModal" not in content:
    content = "import SuccessModal from \"../../components/SuccessModal\";\n" + content

if "showSuccess" not in content:
    content = content.replace("const [password, setPassword] = useState(\"\");", "const [password, setPassword] = useState(\"\");\n  const [showSuccess, setShowSuccess] = useState(false);")

content = content.replace('Alert.alert("Success", "Account created successfully!");', "setShowSuccess(true);")
content = content.replace('router.replace("/(auth)/login");', '')

modal_code2 = """      <SuccessModal
        visible={showSuccess}
        title="Account Created Successfully"
        description="You can now log in to FoundIT."
        buttonLabel="Continue"
        onPressButton={() => {
          setShowSuccess(false);
          router.replace("/(auth)/login");
        }}
      />
    </SafeAreaView>"""

content = content.replace("    </SafeAreaView>\n  );\n}\n", modal_code2 + "\n  );\n}\n")

with open("app/(auth)/signup.tsx", "w") as f:
    f.write(content)

