const { model } = require("mongoose");

const { validateProofSchema } = require("../schemas/validateProofSchema");

const validateProofModel = model("validateProof", validateProofSchema);

module.exports =  validateProofModel ;
