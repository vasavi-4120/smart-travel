const {Schema} = require("mongoose")

const PROOF_NUMBER_REGEX = /^[A-Za-z0-9]{5,20}$/;

const validateProofSchema = new Schema ({
   identityProof: {
      type: String,
      required: true,
      enum: ["PAN", "Aadhaar", "Passport", "VoterID", "DrivingLicense"]
    },
    proofNumber: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      match: [
        PROOF_NUMBER_REGEX,
        "Proof number must be alphanumeric (5–20 characters)."
      ]
    },
})

module.exports = { validateProofSchema };