const Trip = require("../model/TripModel.js");
const ValidateProof = require("../model/validateProofModel.js");

exports.proofUpload = async (req, res) => {
  try {
    const { identityProof, proofNumber } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: "Proof image required" });
    }

    if (!identityProof || !proofNumber) {
      return res.status(400).json({ error: "Identity proof type and number are required" });
    }

    // Generate image URL
    const imageUrl = `${req.protocol}://${req.get('host')}/uploads/proofs/${req.file.filename}`;

    res.status(201).json({
      message: "Proof uploaded successfully",
      proofData: {
        identityProof,
        proofNumber,
        proofImage: imageUrl,
      }
    });

  } catch (err) {
    console.error("Proof upload error:", err);
    res.status(400).json({ error: err.message });
  }
}

// exports.proofUpload = async (req, res) => {
//   try {
//     const { identityProof, proofNumber } = req.body;

//     if (!req.file) {
//       return res.status(400).json({ error: "Proof image required" });
//     }

//     if (!identityProof || !proofNumber) {
//       return res.status(400).json({ error: "Identity proof type and number are required" });
//     }

//     // Generate image URL
//     const imageUrl = `${req.protocol}://${req.get('host')}/uploads/proofs/${req.file.filename}`;

//     // DON'T save to ValidateProof collection yet
//     // Just return the file info to frontend

//     res.status(201).json({
//       message: "Proof uploaded successfully",
//        proofData: {
//         identityProof,
//         proofNumber,
//         proofImage: imageUrl,
//       }
//     });

//   } catch (err) {
//     console.error("Proof upload error:", err);
//     res.status(400).json({ error: err.message });
//   }
// }

// Validate proof - check if it exists in database
exports.validateProof = async (req, res) => {
  try {
    const { identityProof, proofNumber } = req.body;
    
    console.log('Validating:', { identityProof, proofNumber });

    // Check if proof exists in ValidateProof collection
    const existingProof = await ValidateProof.findOne({
      identityProof: identityProof,
      proofNumber: proofNumber,
    });

    console.log('Found proof:', existingProof);

    if (existingProof) {
      // existingProof.status = "approved";
      // await existingProof.save();

      return res.json({
        status: "approved",
        message: "Proof verified successfully"
      });
    } else {
      return res.status(400).json({
        status: "rejected",
        message: "Invalid proof details"
      });
    }

  } catch (error) {
    console.error('Validation error:', error);
    res.status(500).json({ error: error.message });
    }
};

// Admin route to validate proof
exports.adminValidateProof = async (req, res) => {
  try {
    const { identityProof, proofNumber } = req.body;

    const proof = await ValidateProof.findOne({
      identityProof: identityProof,
      proofNumber: proofNumber
    });

    if (!proof) {
      return res.status(404).json({ error: "Invalid Proof Details ❌" });
    }

    proof.status = "approved";
    await proof.save();
    
    res.json({ 
      message: "Proof Validated Successfully ✅",
      proof 
    });
  } catch (error) {
    console.error('Admin validation error:', error);
    res.status(500).json({ error: "Server Error" });
  }
};

// const Trip = require("../model/TripModel.js");
// const ValidateProof = require("../model/validateProofModel.js"); // ✅ Correct import


// //for adding sample data in database
// // module.exports.proofUpload = async (req, res) => {
// //   try {
// //     const { identityProof, proofNumber } = req.body;

// //     if (!req.file) {
// //       return res.status(400).json({ error: "Proof image required" });
// //     }

// //     // Save the proof to database
// //     const newProof = new ValidateProof({
// //       identityProof,
// //       proofNumber,
// //       // You might want to store the image path too
// //     });
// //     await newProof.save();

// //     const proofData = {
// //       identityProof,
// //       proofNumber,
// //       proofImage: req.file.path
// //     };

// //     res.status(201).json({
// //       message: "Proof uploaded successfully",
// //       proofData
// //     });
// //   } catch (err) {
// //     res.status(400).json({ error: err.message });
// //   }
// // }


// exports.validateProof = async (req, res) => {
//   try {
//     const { identityProof, proofNumber } = req.body;
    
//     console.log('Validating:', { identityProof, proofNumber });

//     // ✅ Correct query - looking for top-level fields
//     const existingProof = await ValidateProof.findOne({
//       identityProof: identityProof,
//       proofNumber: proofNumber
//     });

//     console.log('Found proof:', existingProof);

//     if (existingProof) {
//       return res.json({
//         status: "approved",
//         message: "Proof verified successfully"
//       });
//     } else {
//       return res.status(400).json({
//         status: "rejected",
//         message: "Invalid proof details"
//       });
//     }

//   } catch (error) {
//     console.error('Validation error:', error);
//     res.status(500).json({ error: error.message });
//   }
// };

// // Admin route to validate proof
// exports.adminValidateProof = async (req, res) => {
//   try {
//     const { identityProof, proofNumber } = req.body;

//     const proof = await ValidateProof.findOne({
//       identityProof: identityProof,
//       proofNumber: proofNumber
//     });

//     if (!proof) {
//       return res.status(404).json({ error: "Invalid Proof Details ❌" });
//     }

//     proof.status = "approved";
//     await proof.save();
    
//     res.json({ 
//       message: "Proof Validated Successfully ✅",
//       proof 
//     });
//   } catch (error) {
//     console.error('Admin validation error:', error);
//     res.status(500).json({ error: "Server Error" });
//   }
// };


