import re

with open("Admin/frontend/src/pages/Claims.jsx", "r") as f:
    content = f.read()

content = content.replace('{claim.lost_location || "N/A"}', '{claim.lost_location || "Not provided"}')
content = content.replace(').toLocaleString()\n                                        : "N/A"}', ').toLocaleString()\n                                        : "Not provided"}')
content = content.replace('{claim.contact_info || "N/A"}', '{claim.contact_info || "Not provided"}')

with open("Admin/frontend/src/pages/Claims.jsx", "w") as f:
    f.write(content)

