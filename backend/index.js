require("dotenv").config();

require("./cron/completeTrips");

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");

const authRoute = require("./routes/AuthRoute");
const tripRoute = require("./routes/tripRoute");
const proofRoute = require("./routes/ProofRoute");

const  validateProofModel  = require("./model/validateProofModel");

const PORT = process.env.PORT || 9000;
const uri = process.env.MONGO_URL;

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// app.options("/*", cors());

app.use(bodyParser.json());
app.use(express.json());
app.use(cookieParser());

// app.get("/", (req, res) => res.send("API running"));

app.use("/api/auth", authRoute);

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/trips", tripRoute);
app.use("/api/proof", proofRoute);

// app.get("/proofdata", async (req, res) => {
//   let tempProofData = [
//     // ---------- PAN (30) ----------
//     { identityProof: "PAN", proofNumber: "ABCDE1234F" },
//     { identityProof: "PAN", proofNumber: "PQRSX5678L" },
//     { identityProof: "PAN", proofNumber: "LMNOP9012Q" },
//     { identityProof: "PAN", proofNumber: "ZXCVB3456M" },
//     { identityProof: "PAN", proofNumber: "ASDFG7890R" },
//     { identityProof: "PAN", proofNumber: "QWERT1122K" },
//     { identityProof: "PAN", proofNumber: "YUIOP3344P" },
//     { identityProof: "PAN", proofNumber: "HJKLA5566T" },
//     { identityProof: "PAN", proofNumber: "BNMVC7788Z" },
//     { identityProof: "PAN", proofNumber: "PLMKO9900A" },

//     { identityProof: "PAN", proofNumber: "ABCDE4321F" },
//     { identityProof: "PAN", proofNumber: "QAZWS6789L" },
//     { identityProof: "PAN", proofNumber: "EDCRF5432M" },
//     { identityProof: "PAN", proofNumber: "TGBNH0987R" },
//     { identityProof: "PAN", proofNumber: "YHNJM2468P" },
//     { identityProof: "PAN", proofNumber: "MIKOL1357K" },
//     { identityProof: "PAN", proofNumber: "UJNBG8642T" },
//     { identityProof: "PAN", proofNumber: "RFVTG9753Z" },
//     { identityProof: "PAN", proofNumber: "QWERT2468A" },
//     { identityProof: "PAN", proofNumber: "ZXCAS1357F" },

//     { identityProof: "PAN", proofNumber: "PLKJU1123L" },
//     { identityProof: "PAN", proofNumber: "MNBVC4455M" },
//     { identityProof: "PAN", proofNumber: "ASDER6677R" },
//     { identityProof: "PAN", proofNumber: "GHJKL8899P" },
//     { identityProof: "PAN", proofNumber: "POIUY0001K" },
//     { identityProof: "PAN", proofNumber: "LKJHG2223T" },
//     { identityProof: "PAN", proofNumber: "QAZXC4445Z" },
//     { identityProof: "PAN", proofNumber: "WSXED6667A" },
//     { identityProof: "PAN", proofNumber: "CRFVT8889F" },
//     { identityProof: "PAN", proofNumber: "TGBYN9990L" },

//     // ---------- Aadhaar (25) ----------
//     { identityProof: "Aadhaar", proofNumber: "111122223333" },
//     { identityProof: "Aadhaar", proofNumber: "444455556666" },
//     { identityProof: "Aadhaar", proofNumber: "777788889999" },
//     { identityProof: "Aadhaar", proofNumber: "123456789012" },
//     { identityProof: "Aadhaar", proofNumber: "210987654321" },
//     { identityProof: "Aadhaar", proofNumber: "555566667777" },
//     { identityProof: "Aadhaar", proofNumber: "888899990000" },
//     { identityProof: "Aadhaar", proofNumber: "246824682468" },
//     { identityProof: "Aadhaar", proofNumber: "135713571357" },
//     { identityProof: "Aadhaar", proofNumber: "909090909090" },

//     { identityProof: "Aadhaar", proofNumber: "121212121212" },
//     { identityProof: "Aadhaar", proofNumber: "343434343434" },
//     { identityProof: "Aadhaar", proofNumber: "565656565656" },
//     { identityProof: "Aadhaar", proofNumber: "787878787878" },
//     { identityProof: "Aadhaar", proofNumber: "999900001111" },
//     { identityProof: "Aadhaar", proofNumber: "112233445566" },
//     { identityProof: "Aadhaar", proofNumber: "667788990011" },
//     { identityProof: "Aadhaar", proofNumber: "101010101010" },
//     { identityProof: "Aadhaar", proofNumber: "202020202020" },
//     { identityProof: "Aadhaar", proofNumber: "303030303030" },

//     { identityProof: "Aadhaar", proofNumber: "404040404040" },
//     { identityProof: "Aadhaar", proofNumber: "505050505050" },
//     { identityProof: "Aadhaar", proofNumber: "606060606060" },
//     { identityProof: "Aadhaar", proofNumber: "707070707070" },
//     { identityProof: "Aadhaar", proofNumber: "808080808080" },

//     // ---------- Passport (20) ----------
//     { identityProof: "Passport", proofNumber: "A1234567" },
//     { identityProof: "Passport", proofNumber: "B2345678" },
//     { identityProof: "Passport", proofNumber: "C3456789" },
//     { identityProof: "Passport", proofNumber: "D4567890" },
//     { identityProof: "Passport", proofNumber: "E5678901" },
//     { identityProof: "Passport", proofNumber: "F6789012" },
//     { identityProof: "Passport", proofNumber: "G7890123" },
//     { identityProof: "Passport", proofNumber: "H8901234" },
//     { identityProof: "Passport", proofNumber: "J9012345" },
//     { identityProof: "Passport", proofNumber: "K0123456" },

//     { identityProof: "Passport", proofNumber: "L1234098" },
//     { identityProof: "Passport", proofNumber: "M2345097" },
//     { identityProof: "Passport", proofNumber: "N3456096" },
//     { identityProof: "Passport", proofNumber: "P4567095" },
//     { identityProof: "Passport", proofNumber: "R5678094" },
//     { identityProof: "Passport", proofNumber: "S6789093" },
//     { identityProof: "Passport", proofNumber: "T7890092" },
//     { identityProof: "Passport", proofNumber: "U8901091" },
//     { identityProof: "Passport", proofNumber: "V9012090" },
//     { identityProof: "Passport", proofNumber: "W0123089" },

//     // ---------- VoterID (15) ----------
//     { identityProof: "VoterID", proofNumber: "ABC1234567" },
//     { identityProof: "VoterID", proofNumber: "DEF2345678" },
//     { identityProof: "VoterID", proofNumber: "GHI3456789" },
//     { identityProof: "VoterID", proofNumber: "JKL4567890" },
//     { identityProof: "VoterID", proofNumber: "MNO5678901" },
//     { identityProof: "VoterID", proofNumber: "PQR6789012" },
//     { identityProof: "VoterID", proofNumber: "STU7890123" },
//     { identityProof: "VoterID", proofNumber: "VWX8901234" },
//     { identityProof: "VoterID", proofNumber: "YZA9012345" },
//     { identityProof: "VoterID", proofNumber: "BCD0123456" },

//     { identityProof: "VoterID", proofNumber: "EFG1234509" },
//     { identityProof: "VoterID", proofNumber: "HIJ2345608" },
//     { identityProof: "VoterID", proofNumber: "KLM3456707" },
//     { identityProof: "VoterID", proofNumber: "NOP4567806" },
//     { identityProof: "VoterID", proofNumber: "QRS5678905" },

//     // ---------- Driving License (10) ----------
//     { identityProof: "DrivingLicense", proofNumber: "DL0420111234567" },
//     { identityProof: "DrivingLicense", proofNumber: "DL0520122345678" },
//     { identityProof: "DrivingLicense", proofNumber: "DL0620133456789" },
//     { identityProof: "DrivingLicense", proofNumber: "DL0720144567890" },
//     { identityProof: "DrivingLicense", proofNumber: "DL0820155678901" },
//     { identityProof: "DrivingLicense", proofNumber: "DL0920166789012" },
//     { identityProof: "DrivingLicense", proofNumber: "DL1020177890123" },
//     { identityProof: "DrivingLicense", proofNumber: "DL1120188901234" },
//     { identityProof: "DrivingLicense", proofNumber: "DL1220199012345" },
//     { identityProof: "DrivingLicense", proofNumber: "DL1320200123456" },
//   ];
//   tempProofData.forEach((item) => {
//     let newProof = new validateProofModel({
//       identityProof: item.identityProof,
//       proofNumber: item.proofNumber,
//     });
//     newProof.save();
//   });
//   res.send("Done!");
// });

app.listen(PORT, () => {
  console.log(`server is working ${PORT}`);
  mongoose
    .connect(uri)
    .then(() => console.log("MongoDB is  connected successfully"))
    .catch((err) => console.error(err));
});
