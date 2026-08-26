import re

def render_img(item_var):
    return "{ " + item_var + "?.image ? (\n" + \
           "    <img src={" + item_var + ".image.startsWith('file://') ? " + item_var + ".image : `http://localhost:5000${" + item_var + ".image}`} alt=\"Item\" className=\"w-full h-full object-cover\" />\n" + \
           ") : (\n" + \
           "    <Box size={20} />\n" + \
           ") }"

# 1. Claims.jsx
with open("Admin/frontend/src/pages/Claims.jsx", "r") as f:
    content = f.read()
old = """<div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 flex-shrink-0">
                              <Box size={20} />
                            </div>"""
new = """<div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 flex-shrink-0 overflow-hidden">
                              """ + render_img("claim.item") + """
                            </div>"""
content = content.replace(old, new)
with open("Admin/frontend/src/pages/Claims.jsx", "w") as f:
    f.write(content)

# 2. Overview.jsx
with open("Admin/frontend/src/pages/Overview.jsx", "r") as f:
    content = f.read()
old2 = """<div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500">
                        <Box size={20} />
                      </div>"""
new2 = """<div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500 overflow-hidden">
                        """ + render_img("claim.item") + """
                      </div>"""
content = content.replace(old2, new2)
with open("Admin/frontend/src/pages/Overview.jsx", "w") as f:
    f.write(content)

# 3. FoundItems.jsx
with open("Admin/frontend/src/pages/FoundItems.jsx", "r") as f:
    content = f.read()
old3 = "{item.image ? <img src={item.image} alt={item.title} className=\"w-full h-full object-cover\" /> : <Box size={20} />}"
new3 = render_img("item").replace("size={20}", "size={24}")
content = content.replace(old3, new3)
with open("Admin/frontend/src/pages/FoundItems.jsx", "w") as f:
    f.write(content)

# 4. LostItems.jsx
with open("Admin/frontend/src/pages/LostItems.jsx", "r") as f:
    content = f.read()
old4 = "{item.image ? <img src={item.image} alt={item.title} className=\"w-full h-full object-cover\" /> : <Box size={24} />}"
new4 = render_img("item").replace("size={20}", "size={24}")
content = content.replace(old4, new4)
with open("Admin/frontend/src/pages/LostItems.jsx", "w") as f:
    f.write(content)

