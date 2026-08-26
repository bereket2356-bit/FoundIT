import re

with open("app/(tabs)/home.tsx", "r") as f:
    content = f.read()

submit_claim_new = """  const submitClaim = async () => {
    if (!proofDescription || !contactInfo) {
      return;
    }
    if (!selectedItemForClaim) return;

    setSubmittingClaim(true);
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await axios.post(
        `${API_URL}/items/${selectedItemForClaim._id}/claim`,
        {
          proof_description: proofDescription,
          proof_image: proofImage || "",
          lost_location: lostLocation || "",
          lost_date: lostDate || "",
          contact_info: contactInfo,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      // Update item in feed
      setItems((prev) =>
        prev.map((it) => (it._id === selectedItemForClaim._id ? res.data : it)),
      );

      Alert.alert("Success", "Claim submitted — we'll review it soon.");

      // Reset Modal
      setClaimModalVisible(false);
      setSelectedItemForClaim(null);
      setProofDescription("");
      setProofImage(null);
      setLostLocation("");
      setLostDate("");
      setContactInfo("");
    } catch (err) {
      console.log("Claim error", err.response?.data || err);
      const code = err.response?.data?.code;
      if (code === "DUPLICATE_CLAIM") {
        Alert.alert("Claim Error", "This item already has a pending claim under review.");
      } else if (code === "VALIDATION_ERROR") {
        Alert.alert("Claim Error", "Please fill out all required fields.");
      } else if (code === "INVALID_STATE") {
        Alert.alert("Claim Error", "Item is not available for claim.");
      } else if (err.response?.status === 401) {
        Alert.alert("Claim Error", "Your session expired — please log in again to submit a claim.");
      } else if (err.message.includes("Network")) {
        Alert.alert("Claim Error", "Something went wrong on our end. Please try again in a moment.");
      } else {
        Alert.alert("Claim Error", "Something went wrong on our end. Please try again in a moment.");
      }
    } finally {
      setSubmittingClaim(false);
    }
  };"""

modal_new = """      <Modal
        visible={claimModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: "#f9fafb" }}>
          <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: "#eee", backgroundColor: "#fff", flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={{ fontSize: 18, fontWeight: "bold", color: "#1f2937" }}>Submit Claim</Text>
            <TouchableOpacity onPress={() => setClaimModalVisible(false)}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: 20 }}>
            <Text style={{ fontSize: 14, fontWeight: "600", marginBottom: 6, color: "#374151" }}>Describe details only the owner would know *</Text>
            <TextInput
              style={{ backgroundColor: "#fff", borderWidth: 1, borderColor: "#d1d5db", borderRadius: 8, padding: 12, minHeight: 80, textAlignVertical: "top", marginBottom: 4 }}
              placeholder="e.g. lock screen photo, scratches, keychain..."
              multiline
              value={proofDescription}
              onChangeText={setProofDescription}
            />
            {(!proofDescription && submittingClaim) ? <Text style={{color: "red", fontSize: 12, marginBottom: 12}}>This field is required.</Text> : <View style={{marginBottom: 16}} />}

            <Text style={{ fontSize: 14, fontWeight: "600", marginBottom: 6, color: "#374151" }}>Phone or Telegram username *</Text>
            <TextInput
              style={{ backgroundColor: "#fff", borderWidth: 1, borderColor: "#d1d5db", borderRadius: 8, padding: 12, marginBottom: 4 }}
              placeholder="@username or 09..."
              value={contactInfo}
              onChangeText={setContactInfo}
            />
            {(!contactInfo && submittingClaim) ? <Text style={{color: "red", fontSize: 12, marginBottom: 12}}>This field is required.</Text> : <View style={{marginBottom: 16}} />}

            <Text style={{ fontSize: 14, fontWeight: "600", marginBottom: 6, color: "#374151" }}>Photo proof <Text style={{fontWeight: "400", color: "#9ca3af"}}>(optional)</Text></Text>
            <TouchableOpacity onPress={pickProofImage} style={{ backgroundColor: "#fff", borderWidth: 1, borderColor: "#d1d5db", borderStyle: "dashed", padding: 16, borderRadius: 8, alignItems: "center", marginBottom: 16 }}>
              {proofImage ? (
                <Image source={{ uri: proofImage }} style={{ width: 60, height: 60, borderRadius: 8 }} />
              ) : (
                <Text style={{ color: "#6b7280" }}>Tap to upload</Text>
              )}
            </TouchableOpacity>

            <Text style={{ fontSize: 14, fontWeight: "600", marginBottom: 6, color: "#374151" }}>Where you lost it <Text style={{fontWeight: "400", color: "#9ca3af"}}>(optional)</Text></Text>
            <TextInput
              style={{ backgroundColor: "#fff", borderWidth: 1, borderColor: "#d1d5db", borderRadius: 8, padding: 12, marginBottom: 16 }}
              placeholder="e.g. Library 2nd floor"
              value={lostLocation}
              onChangeText={setLostLocation}
            />
            
            <Text style={{ fontSize: 14, fontWeight: "600", marginBottom: 6, color: "#374151" }}>When you lost it <Text style={{fontWeight: "400", color: "#9ca3af"}}>(optional)</Text></Text>
            <TextInput
              style={{ backgroundColor: "#fff", borderWidth: 1, borderColor: "#d1d5db", borderRadius: 8, padding: 12, marginBottom: 24 }}
              placeholder="YYYY-MM-DD"
              value={lostDate}
              onChangeText={setLostDate}
            />

            <TouchableOpacity
              style={{ backgroundColor: (!proofDescription || !contactInfo || submittingClaim) ? "#9ca3af" : "#4f46e5", padding: 16, borderRadius: 8, alignItems: "center", marginBottom: 32, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3 }}
              onPress={submitClaim}
              disabled={!proofDescription || !contactInfo || submittingClaim}
            >
              <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 16 }}>
                {submittingClaim ? "Submitting..." : "Submit Claim"}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>"""

# Replace submitClaim
content = re.sub(r'  const submitClaim = async \(\) => \{.*?(?=\n  const \[activeTab)/s', submit_claim_new + "\n", content)

# Replace Modal
content = re.sub(r'      <Modal.*?      </Modal>/s', modal_new, content, flags=re.DOTALL)

with open("app/(tabs)/home.tsx", "w") as f:
    f.write(content)

