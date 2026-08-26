import re

with open("app/(tabs)/post.tsx", "r") as f:
    content = f.read()

# Add import
if "SuccessModal" not in content:
    content = content.replace("import { Ionicons } from \"@expo/vector-icons\";", "import { Ionicons } from \"@expo/vector-icons\";\nimport SuccessModal from \"../components/SuccessModal\";")

# Add state
if "showSuccess" not in content:
    content = content.replace("const [image, setImage] = useState<string | null>(null);", "const [image, setImage] = useState<string | null>(null);\n  const [showSuccess, setShowSuccess] = useState(false);")

# Update success alert
content = content.replace('Alert.alert("Success", "Your item has been posted!");', "setShowSuccess(true);")
content = content.replace('router.replace("/(tabs)/home");', '')

# Add the component at the end of the return
modal_code = """      <SuccessModal
        visible={showSuccess}
        title="Form Submitted"
        description="Wait for admin review."
        buttonLabel="Continue"
        onPressButton={() => {
          setShowSuccess(false);
          router.replace("/(tabs)/home");
        }}
      />
    </SafeAreaView>"""

content = content.replace("    </SafeAreaView>\n  );\n}\n", modal_code + "\n  );\n}\n")

with open("app/(tabs)/post.tsx", "w") as f:
    f.write(content)

