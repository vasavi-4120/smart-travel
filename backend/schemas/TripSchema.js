// models/Trip.js
const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");
// const combineDateAndTime = require("../controllers/tripController").combineDateAndTime;
// const calculateStatus = require("../controllers/tripController").calculateStatus;

const MOBILE_REGEX = /^[0-9]{10}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const TravelerSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, required: true },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      required: true,
      match: [EMAIL_REGEX, "Invalid email format."],
    },
    dob: {
      type: Date,
      required: true,
    },
    gender: {
      type: String,
      enum: [
        "Male",
        "Female",
        "Non-binary",
        "Prefer not to say",
        "Other",
        "male",
        "female",
        "non-binary",
        "prefer not to say",
        "other",
      ],
      required: true,
    },
    age: {
      type: Number,
      min: [0, "Age cannot be negative."],
      max: [100, "Age seems unrealistic."],
      required: true,
    },
    nationality: { type: String, trim: true, default: "Indian" },
    address: { type: String, required: true },
  },
  { _id: false },
);

const ContactDetailsSchema = new mongoose.Schema(
  {
    mobileNumber: {
      type: String,
      required: true,
      match: [
        MOBILE_REGEX,
        "Mobile number must be 10 digits (no country code).",
      ],
    },
    friend1: {
      type: String,
      trim: true,
      default: "",
    },
    emergencyContact1: {
      type: String,
      match: [MOBILE_REGEX, "Emergency contact must be 10 digits."],
      required: true,
    },
    emergencyemail1: {
      type: String,
      lowercase: true,
      trim: true,
      required: true,
      match: [EMAIL_REGEX, "Invalid email format."],
    },
    friend2: {
      type: String,
      trim: true,
      default: "",
    },
    emergencyContact2: {
      type: String,
      match: [MOBILE_REGEX, "Emergency contact must be 10 digits."],
    },
    emergencyemail2: {
      type: String,
      lowercase: true,
      trim: true,
      match: [EMAIL_REGEX, "Invalid email format."],
    },
    relationship: {
      type: String,
      enum: [
        "Mother",
        "Father",
        "Sister",
        "Brother",
        "Spouse",
        "Other",
        "mother",
        "father",
        "sister",
        "brother",
        "spouse",
        "other",
      ],
      trim: true,
      default: "",
    },
    relationshipContact: {
      type: String,
      match: [MOBILE_REGEX, "Emergency contact must be 10 digits."],
    },
    relationshipemail: {
      type: String,
      lowercase: true,
      trim: true,
      required: true,
      match: [EMAIL_REGEX, "Invalid email format."],
    },
  },
  { _id: false },
);

const PROOF_NUMBER_REGEX = /^[A-Za-z0-9]{5,20}$/;

const ProofSchema = new mongoose.Schema(
  {
    identityProof: {
      type: String,
      required: true,
      enum: ["PAN", "Aadhaar", "Passport", "VoterID", "DrivingLicense"],
    },
    proofNumber: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      match: [
        PROOF_NUMBER_REGEX,
        "Proof number must be alphanumeric (5–20 characters).",
      ],
    },
    proofImage: {
      type: String, // file path or cloud URL
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "approved",
    },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const TripSchema = new mongoose.Schema(
  {
    tripId: {
      type: String,
      unique: true,
      default: uuidv4,
      index: true,
      required: true,
    },

    status: {
      type: String,
      enum: ["Pending", "Active", "Completed", "Emergency", "Cancelled","active","pending","completed","emergency","cancelled"],
      default: "Pending",
      index: true,
    },

    cancelledAt: {
      type: Date,
    },
    cancelReason: {
      type: String,
      trim: true,
    },

    expiresAt: {
      type: Date,
    },

    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },

    traveler: { type: TravelerSchema, required: true },
    contactDetails: { type: ContactDetailsSchema, required: true },
    proof: { type: ProofSchema, required: true },

    // from: { type: String, trim: true, lat: Number, lng: Number, default: "" },
    // to: { type: String, trim: true, lat: Number, lng: Number, default: "" },
    from: {
      name: { type: String, trim: true },
      lat: { type: Number },
      lng: { type: Number },
    },

    to: {
      name: { type: String, trim: true },
      lat: { type: Number },
      lng: { type: Number },
    },
    purposeOfWork: { type: String, trim: true },
    accommodation: { type: String, trim: true },
    meansOfTransport: { type: String, trim: true },
    startDate: { type: Date },
    endDate: { type: Date },
    startTime: { type: String },
    endTime: { type: String },
    numberOfDaysStaying: { type: Number, trim: true, default: 1 },
    peopleTravel: { type: Number, trim: true, default: 1 },
    liveLocation: {
      lat: Number,
      lng: Number,
    },
    locationHistory: [
      {
        lat: Number,
        lng: Number,
        timestamp: { type: Date, default: Date.now },
      },
    ],
    sosTriggered: { type: Boolean, default: false },
    sosLocation: {
      lat: Number,
      lng: Number,
    },
    sosPlaces: [
      {
        name: String,
        address: String,
        distance: String,
        lat: Number,
        lng: Number,
      },
    ],
    sharedPlaces: { type: Boolean, default: false },
    touristPlaces: [
      {
        name: String,
        address: String,
        distance: String,
        lat: Number,
        lng: Number,
      },
    ],
    lastWeatherCondition: {
      type: String,
    },
    lastTrafficAlert: {
      type: String,
      default: "",
    },
    lastLocationEmailTime: {
      type: Date,
      default: null,
    },
    lastSosEmailTime: {
      type: Date,
      default: null,
    },
    locationShared: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

// function combineDateAndTime(date, time) {
//   if (!date || !time) return null;

//   const [hours, minutes] = time.split(":");
//   const combined = new Date(date);

//   combined.setHours(parseInt(hours));
//   combined.setMinutes(parseInt(minutes));
//   combined.setSeconds(0);
//   combined.setMilliseconds(0);

//   return combined;
// }

// function calculateStatus(start, end) {
//   const now = new Date();

//   if (now < start) return "Pending";
//   if (now >= start && now <= end) return "Active";
//   return "Completed";
// }

// TripSchema.pre("save", async function () {
//   const trip = this;

//   // Emergency priority
//   if (trip.sosTriggered) {
//     trip.status = "Emergency";
//     return trip.save();
//   }

//   // Terminal states
//   const terminalStates = ["Cancelled", "Completed", "Emergency"];
//   if (terminalStates.includes(trip.status)) {
//     return;
//   }

//   // ✅ Only run when relevant fields change
//   if (
//     this.isModified("startDate") ||
//     this.isModified("endDate") ||
//     this.isModified("startTime") ||
//     this.isModified("endTime")
//   ) {
//     const startDateTime = combineDateAndTime(trip.startDate, trip.startTime);
//     const endDateTime = combineDateAndTime(trip.endDate, trip.endTime);

//     if (startDateTime && endDateTime) {
//       trip.status = calculateStatus(startDateTime, endDateTime);
//     }
//   }
//   console.log("🔥 STATUS CHANGE DETECTED");
//   console.log("Trip:", this.tripId);
//   console.log("New Status:", this.status);
//   console.trace("📍 Who triggered this?");
// });

// TripSchema.pre("save", function (next) {
//   // 🚫 Block status changes from anywhere except cron
//   if (this.isModified("status") && !this._fromCron) {
//     console.log("⛔ BLOCKED STATUS CHANGE (non-cron)");
//     console.trace("WHO TRIED TO CHANGE STATUS");

//     return next(new Error("Status can only be updated by cron"));
//   }

//   next();
// });

module.exports = { TripSchema };
