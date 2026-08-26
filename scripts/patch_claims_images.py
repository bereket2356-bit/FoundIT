import re

with open("Admin/frontend/src/pages/Claims.jsx", "r") as f:
    content = f.read()

# Replace the proof image rendering
old_proof_image = """                                    {claim.proof_image && (
                                      <div className="mt-2">
                                        <strong className="text-slate-800 block mb-1">
                                          Attached Proof:
                                        </strong>
                                        <img
                                          src={claim.proof_image}
                                          alt="Proof"
                                          className="max-w-xs rounded border"
                                        />
                                      </div>
                                    )}"""
new_proof_image = """                                    <div className="mt-4">
                                      <strong className="text-slate-800 block mb-1">
                                        Claimant's Proof Photo:
                                      </strong>
                                      {claim.proof_image ? (
                                        <img
                                          src={claim.proof_image}
                                          alt="Proof"
                                          className="max-w-xs rounded border"
                                        />
                                      ) : (
                                        <p className="text-sm text-slate-500 italic">No photo provided</p>
                                      )}
                                    </div>"""

content = content.replace(old_proof_image, new_proof_image)

# Replace the item image rendering
old_item_image = """                                    {claim.item?.image && (
                                      <div className="mt-2">
                                        <strong className="text-slate-800 block mb-1">
                                          Item Image:
                                        </strong>
                                        <img
                                          src={`http://localhost:5000${claim.item.image}`}
                                          alt="Item"
                                          className="max-w-xs rounded border"
                                        />
                                      </div>
                                    )}"""
new_item_image = """                                    <div className="mt-4">
                                      <strong className="text-slate-800 block mb-1">
                                        Found Item Photo:
                                      </strong>
                                      {claim.item?.image ? (
                                        <img
                                          src={claim.item.image.startsWith('file://') ? claim.item.image : `http://localhost:5000${claim.item.image}`}
                                          alt="Item"
                                          className="max-w-xs rounded border"
                                        />
                                      ) : (
                                        <p className="text-sm text-slate-500 italic">No photo provided</p>
                                      )}
                                    </div>"""
content = content.replace(old_item_image, new_item_image)

with open("Admin/frontend/src/pages/Claims.jsx", "w") as f:
    f.write(content)

