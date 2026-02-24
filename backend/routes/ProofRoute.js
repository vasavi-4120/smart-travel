const express = require("express");
const upload = require("../middlewares/uploadProof");
const router = express.Router();
const { proofUpload,validateProof,adminValidateProof } = require("../controllers/ProofController");

router.post("/upload", upload.single("proofImage"),proofUpload );
router.post("/validate", validateProof);
router.post('/admin/validate-proof', adminValidateProof); // For admin validation

module.exports = router;
