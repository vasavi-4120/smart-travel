import React, { useState } from "react";
import { FaUserPlus } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { MdOutlineTravelExplore } from "react-icons/md";
import { BiSolidContact } from "react-icons/bi";
import { GrValidate } from "react-icons/gr";
import axios from "axios";

function Makeyourtrip() {
  const navigate = useNavigate();
  const [identityProof, setIdentityProof] = useState("");
  const [proofNumber, setProofNumber] = useState("");
  const [proofImage, setProofImage] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [validationStatus, setValidationStatus] = useState("");

  const [formData, setFormData] = useState({
    traveler: {
      name: "",
      email: "",
      dob: "",
      gender: "",
      age: "",
      nationality: "Indian",
      address: "",
    },
    contactDetails: {
      mobileNumber: "",
      friend1: "",
      emergencyContact1: "",
      friend2: "",
      emergencyContact2: "",
      relationship: "",
      relationshipContact: "",
    },
    proof: {
      identityProof: "",
      proofNumber: "",
      proofImage: "",
    },
    from: {
      name: "",
      lat: "",
      lng: "",
    },

    to: {
      name: "",
      lat: "",
      lng: "",
    },
    meansofTransport: "",
    startDate: "",
    endDate: "",
    startTime: "",
    endTime: "",
    peopleTravel: 1,
  });

  const fetchCoordinates = async (placeName) => {
    try {
      const res = await axios.get("http://localhost:8000/api/trips/geocode", {
        params: { place: placeName },
        withCredentials: true,
      });

      if (!res.data?.lat || !res.data?.lng) return null;

      return {
        lat: Number(res.data.lat),
        lng: Number(res.data.lng),
      };
    } catch (error) {
      console.error("Geocode error:", error.response?.data || error.message);
      return null;
    }
  };

  const handleChange = (section, field, value) => {
    if (section) {
      setFormData((prev) => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const handleProofImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const { identityProof, proofNumber } = formData.proof;

    if (!identityProof || !proofNumber) {
      setMessage(
        "Please select identity proof type and enter proof number first",
      );
      return;
    }

    // Validate file
    if (file.size > 2 * 1024 * 1024) {
      setMessage("File too large. Max 2MB");
      return;
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setMessage("Please upload JPEG, PNG, or WEBP image");
      return;
    }

    setProofImage(file);

    const formDataUpload = new FormData();
    formDataUpload.append("proofImage", file);
    formDataUpload.append("identityProof", identityProof);
    formDataUpload.append("proofNumber", proofNumber);

    try {
      setLoading(true);

      const res = await axios.post(
        "http://localhost:8000/api/proof/upload",
        formDataUpload,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      console.log("Upload response:", res.data);

      // Check different possible response structures
      let imageUrl = "";

      if (res.data.proofData?.proofImage) {
        imageUrl = res.data.proofData.proofImage;
      } else if (res.data.imageUrl) {
        imageUrl = res.data.imageUrl;
      } else if (res.data.file?.path) {
        imageUrl = res.data.file.path;
      } else if (res.data.url) {
        imageUrl = res.data.url;
      }

      // Update formData with the uploaded proof data
      setFormData((prev) => ({
        ...prev,
        proof: {
          identityProof: prev.proof.identityProof,
          proofNumber: prev.proof.proofNumber,
          proofImage: imageUrl || "uploaded",
        },
      }));

      setMessage("✅ Proof uploaded successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Upload error:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });

      setMessage(error.response?.data?.error || "❌ Upload failed");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      // // If coordinates missing, fetch them first
      // if (!formData.from.lat) {
      //   await fetchCoordinates(formData.from.name, "from");
      // }

      // if (!formData.to.lat) {
      //   await fetchCoordinates(formData.to.name, "to");
      // }

      // Fetch coordinates safely
      const fromCoords = await fetchCoordinates(formData.from.name);
      const toCoords = await fetchCoordinates(formData.to.name);

      if (!fromCoords || !toCoords) {
        setMessage("Valid From and To locations required");
        setLoading(false);
        return;
      }

      if (!fromCoords?.lat || !toCoords?.lat) {
        setMessage("Valid From and To locations required");
        setLoading(false);
        return;
      }

      // Re-check after fetching
      // if (!formData.from.lat || !formData.to.lat) {
      //   setMessage("Valid From and To locations required");
      //   setLoading(false);
      //   return;
      // }

      const genderMap = {
        male: "Male",
        female: "Female",
        other: "Other",
      };

      const relationshipMap = {
        mother: "Mother",
        father: "Father",
        sister: "Sister",
        brother: "Brother",
        spouse: "Spouse",
        other: "Other",
      };

      const submissionData = {
        ...formData,
        traveler: {
          ...formData.traveler,
          age: formData.traveler.age
            ? Number(formData.traveler.age)
            : undefined,
          gender:
            genderMap[formData.traveler.gender] || formData.traveler.gender,
        },
        contactDetails: {
          ...formData.contactDetails,
          relationship:
            relationshipMap[
              formData.contactDetails.relationship?.toLowerCase()
            ] || formData.contactDetails.relationship,
        },
        from: {
          name: formData.from.name,
          lat: fromCoords.lat,
          lng: fromCoords.lng,
        },
        to: {
          name: formData.to.name,
          lat: toCoords.lat,
          lng: toCoords.lng,
        },
        peopleTravel: Number(formData.peopleTravel),
        startDate: formData.startDate
          ? new Date(formData.startDate).toISOString()
          : undefined,
        endDate: formData.endDate
          ? new Date(formData.endDate).toISOString()
          : undefined,
        startTime: formData.startTime,
        endTime: formData.endTime,
      };

      console.log("Submission data:", submissionData);

      const res = await axios.post(
        "http://localhost:8000/api/trips/register", // ✅ use only ONE correct route
        submissionData,
        { withCredentials: true },
      );

      console.log("Response:", res.data);

      setMessage("✅ Trip registered successfully!");
      setTimeout(() => setMessage(""), 3000);

      navigate("/dashboard");
    } catch (error) {
      console.error("Register error:", error.response?.data || error.message);
      setMessage(
        error.response?.data?.message || "❌ Trip registration failed",
      );
    } finally {
      setLoading(false);
    }
  };

  // const handleRegister = async (e) => {
  //   e.preventDefault();

  //   try {
  //     setLoading(true);

  //     console.log("Sending formData:", formData);

  //     const res = await axios.post(
  //       "http://localhost:8000/api/trip/register",
  //       formData,
  //       {
  //         withCredentials: true, // important if using session authentication
  //       }
  //     );

  //     console.log("Response:", res.data);

  //     setMessage("✅ Trip registered successfully!");
  //     setTimeout(() => setMessage(""), 3000);

  //     navigate("/dashboard"); // change route if needed
  //   } catch (error) {
  //     console.error("Register error:", error.response?.data || error.message);
  //     setMessage(error.response?.data?.message || "❌ Trip registration failed");
  //   } finally {
  //     setLoading(false);
  //   }

  //     // Fix gender to match enum
  //     const genderMap = {
  //       male: "Male",
  //       female: "Female",
  //       other: "Other",
  //     };

  //     const relationshipMap = {
  //       mother: "Mother",
  //       father: "Father",
  //       sister: "Sister",
  //       brother: "Brother",
  //       spouse: "Spouse",
  //       other: "Other",
  //     };
  //  const submissionData = {
  //       ...formData,
  //       traveler: {
  //         ...formData.traveler,
  //         age: formData.traveler.age ? Number(formData.traveler.age) : undefined,
  //         gender: genderMap[formData.traveler.gender] || formData.traveler.gender,
  //       },
  //       contactDetails: {
  //         ...formData.contactDetails,
  //         relationship:
  //           relationshipMap[
  //             formData.contactDetails.relationship?.toLowerCase()
  //           ] || formData.contactDetails.relationship,
  //       },
  //       peopleTravel: Number(formData.peopleTravel),
  //       // Ensure dates are proper format
  //       startDate: formData.startDate
  //         ? new Date(formData.startDate).toISOString()
  //         : undefined,
  //       endDate: formData.endDate
  //         ? new Date(formData.endDate).toISOString()
  //         : undefined,
  //       // Keep times as strings (don't convert to Date)
  //       startTime: formData.startTime,
  //       endTime: formData.endTime,
  //     };

  //     console.log("Submission data:", submissionData);
  //     try {
  //       const res = await axios.post(
  //         "http://localhost:8000/api/trips/register",
  //         submissionData,
  //         {

  //             withCredentials: true,
  //           },
  //       );

  //       alert("Trip Registered Successfully!");
  //       console.log(res.data);
  //       navigate("/dashboard");
  //     } catch (error) {
  //       console.error("Full error:", error);
  //       console.error("Error response:", error.response?.data);
  //       alert(error.response?.data?.error || "Registration Failed");
  //     }
  //   };
  const handleValidate = async (e) => {
    e.preventDefault();

    // Use formData.proof values instead of separate state
    const { identityProof, proofNumber } = formData.proof;

    if (!identityProof || !proofNumber) {
      setMessage("All fields are required ❗");
      return;
    }

    // Check if image is uploaded
    if (!formData.proof.proofImage) {
      setMessage("Please upload proof image first ❗");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      console.log("Sending validation request:", {
        identityProof,
        proofNumber,
      });

      const response = await fetch("http://localhost:8000/api/proof/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          identityProof,
          proofNumber,
        }),
      });

      console.log("Response status:", response.status);

      let data;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        data = { message: await response.text() };
      }

      console.log("Response data:", data);

      if (response.ok) {
        alert("✅ Proof Verified Successfully!");
        setValidationStatus("approved");
      } else {
        alert("❌ " + (data.message || "Validation failed"));
        setValidationStatus("rejected");
      }

      setLoading(false);
    } catch (error) {
      console.error("Full error:", error);
      setMessage("Server error ❌");
      setValidationStatus("error");
      setLoading(false);
    }
  };

  return (
    <div className="flex mt-20 mb-20 p-8 border border-gray-200 rounded-lg max-w-4xl mx-auto shadow-lg bg-white">
      <form className="flex flex-col gap-6" onSubmit={handleRegister}>
        <h1 className="text-3xl font-bold text-center text-violet-600">
          Make Your Trip For Safe Journey
        </h1>

        {/* Personal Info */}
        <section className="flex flex-col gap-4">
          <h2 className="flex gap-1 items-center text-lg font-semibold text-gray-700">
            <FaUserPlus />
            Personal Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1">Name:</label>
              <input
                type="text"
                className="border border-gray-400 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                onChange={(e) =>
                  handleChange("traveler", "name", e.target.value)
                }
                placeholder="Enter your name"
              />
            </div>
            <div>
              <label className="block mb-1">Email:</label>
              <input
                type="email"
                className="border border-gray-400 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                onChange={(e) =>
                  handleChange("traveler", "email", e.target.value)
                }
                placeholder="Enter your email"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1">Date Of Birth:</label>
              <input
                type="date"
                className="border border-gray-400 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                onChange={(e) =>
                  handleChange("traveler", "dob", e.target.value)
                }
              />
            </div>
            <div>
              <label className="block mb-1">Gender:</label>
              <select
                className="border border-gray-400 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                onChange={(e) =>
                  handleChange("traveler", "gender", e.target.value)
                }
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1">Age:</label>
              <input
                className="border border-gray-400 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                onChange={(e) =>
                  handleChange("traveler", "age", e.target.value)
                }
                placeholder="Enter your age"
              />
            </div>
            <div>
              <label className="block mb-1">Nationality:</label>
              <select
                className="border border-gray-400 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                onChange={(e) =>
                  handleChange("traveler", "nationality", e.target.value)
                }
              >
                <option value="india">Indian</option>
                <option value="united states">United States</option>
                <option value="australia">Australia</option>
                <option value="united kingdom">United Kingdom</option>
                <option value="Canada">Canada</option>
                <option value="iran">Iran</option>
                <option value="iraq">Iraq</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block mb-1">Address:</label>
            <input
              className="border border-gray-400 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              onChange={(e) =>
                handleChange("traveler", "address", e.target.value)
              }
              placeholder="Enter your address"
            />
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="flex gap-1 items-center text-lg font-semibold text-gray-700">
            <BiSolidContact />
            Contact Details
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-1">Mobile Number:</label>
              <input
                type="tel"
                className="border border-gray-400 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                onChange={(e) =>
                  handleChange("contactDetails", "mobileNumber", e.target.value)
                }
                placeholder="Enter your 10-digit mobile number without country code"
              />
            </div>
            <div></div>
            <div>
              <label className="block mb-1">Friend 1 :</label>
              <input
                type="text"
                className="border border-gray-400 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                onChange={(e) =>
                  handleChange("contactDetails", "friend1", e.target.value)
                }
                placeholder="Enter Friend Name"
              />
            </div>
            <div>
              <label className="block mb-1">Emergency Contact 1 :</label>
              <input
                type="tel"
                className="border border-gray-400 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                onChange={(e) =>
                  handleChange(
                    "contactDetails",
                    "emergencyContact1",
                    e.target.value,
                  )
                }
                placeholder="Enter your 10-digit mobile number without country code"
              />
            </div>
            <div>
              <label className="block mb-1">Friend 2 :</label>
              <input
                type="text"
                className="border border-gray-400 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                onChange={(e) =>
                  handleChange("contactDetails", "friend2", e.target.value)
                }
                placeholder="Enter Friend Name"
              />
            </div>
            <div>
              <label className="block mb-1">Emergency Contact 2 :</label>
              <input
                type="tel"
                className="border border-gray-400 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                onChange={(e) =>
                  handleChange(
                    "contactDetails",
                    "emergencyContact2",
                    e.target.value,
                  )
                }
                placeholder="Enter your 10-digit mobile number without country code"
              />
            </div>
            <div>
              <label className="block mb-1">RelationShip :</label>
              <select
                className="border border-gray-400 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                onChange={(e) =>
                  handleChange("contactDetails", "relationship", e.target.value)
                }
              >
                <option value="">Select relation</option>
                <option value="father">Father</option>
                <option value="mother">Mother</option>
                <option value="brother">Brother</option>
                <option value="sister">Sister</option>
                <option value="spouse">Spouse</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block mb-1">RelationShip Contact :</label>
              <input
                type="tel"
                className="border border-gray-400 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                onChange={(e) =>
                  handleChange(
                    "contactDetails",
                    "relationshipContact",
                    e.target.value,
                  )
                }
                placeholder="Enter your 10-digit mobile number without country code"
              />
            </div>
          </div>
        </section>

        {/* Identity Proof */}
        <section className="flex flex-col gap-4">
          <h2 className="flex gap-2 items-center text-lg font-semibold text-gray-700">
            <GrValidate />
            Identity Proof
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-1">Identity Proof</label>
              <select
                className="border border-gray-400 rounded px-3 py-2 w-full"
                placeholder="Select identity proof type"
                onChange={(e) => {
                  const value = e.target.value;
                  handleChange("proof", "identityProof", value);
                  setIdentityProof(value);
                }}
              >
                <option value="">Select</option>
                <option value="PAN">PAN</option>
                <option value="Aadhaar">Aadhaar</option>
                <option value="Passport">Passport</option>
                <option value="VoterID">VoterID</option>
                <option value="DrivingLicense">Driving License</option>
              </select>
            </div>
            <div>
              <label className="block mb-1">Proof Number</label>
              <input
                className="border border-gray-400 rounded px-3 py-2 w-full"
                placeholder="Enter proof number"
                onChange={(e) => {
                  const value = e.target.value;
                  handleChange("proof", "proofNumber", value);
                  setProofNumber(value);
                }}
              />
            </div>

            <div>
              <label className="block mb-1">Proof Image</label>
              <input
                type="file"
                accept="image/*"
                className="border border-gray-400 rounded px-3 py-2 w-full"
                onChange={handleProofImageUpload}
              />
            </div>
          </div>

          {/* Message display - added for better UX */}
          {message && (
            <div
              className={`text-center p-2 rounded ${
                validationStatus === "approved"
                  ? "bg-green-100 text-green-700"
                  : validationStatus === "rejected"
                    ? "bg-red-100 text-red-700"
                    : "bg-yellow-100 text-yellow-700"
              }`}
            >
              {message}
            </div>
          )}

          <button
            onClick={handleValidate}
            className="bg-blue-600 text-white font-semibold sm:w-auto w-full px-3 py-3 mx-86 rounded-full hover:bg-blue-700 transition"
            disabled={loading}
          >
            {loading ? "Validating..." : "Validate Proof"}
          </button>
          {validationStatus === "approved" && (
            <div className="text-green-600 font-semibold text-center mt-2">
              ✅ Proof Verified Successfully! You can now enter trip details.
            </div>
          )}

          {validationStatus === "rejected" && (
            <div className="text-red-600 font-semibold text-center mt-2">
              ❌ Proof Validation Failed! Please check your details.
            </div>
          )}
        </section>
        {/* Trip Details */}
        {validationStatus === "approved" && (
          <section className="flex flex-col gap-4">
            <h2 className="flex gap-1 items-center text-lg font-semibold text-gray-700">
              <MdOutlineTravelExplore />
              Trip Details
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {/* <div>
                <label className="block mb-1">From:</label>
                <input
                  className="border border-gray-400 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onChange={(e) => handleChange(null, "from", e.target.value)}
                  placeholder="Enter starting place"
                />
              </div>
              <div>
                <label className="block mb-1">To:</label>
                <input
                  className="border border-gray-400 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onChange={(e) => handleChange(null, "to", e.target.value)}
                  placeholder="Enter destination"
                />
              </div> */}
              <div>
                <label className="block mb-1">From:</label>
                <input
                  className="border border-gray-400 rounded px-3 py-2 w-full"
                  value={formData.from.name}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      from: {
                        name: e.target.value,
                        lat: "", // reset coordinates
                        lng: "",
                      },
                    }))
                  }
                  onBlur={() => fetchCoordinates(formData.from.name, "from")}
                  placeholder="Enter starting place"
                />
              </div>

              <div>
                <label className="block mb-1">To:</label>
                <input
                  className="border border-gray-400 rounded px-3 py-2 w-full"
                  value={formData.to.name}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      to: {
                        name: e.target.value,
                        lat: "", // reset coordinates
                        lng: "",
                      },
                    }))
                  }
                  onBlur={() => fetchCoordinates(formData.to.name, "to")}
                  placeholder="Enter destination"
                />
              </div>
              <div>
                <label className="block mb-1">Means of transport :</label>
                <textarea
                  type="text"
                  className="border border-gray-400 rounded px-3 py-2 w-[830px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onChange={(e) =>
                    handleChange(null, "meansofTransport", e.target.value)
                  }
                  placeholder="Ex : Bus, Train, Flight, Car, etc."
                />
              </div>
              <div></div>
              <div>
                <label className="block mb-1">Starting Date:</label>
                <input
                  type="date"
                  className="border border-gray-400 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onChange={(e) =>
                    handleChange(null, "startDate", e.target.value)
                  }
                />
              </div>
              <div>
                <label className="block mb-1">Ending Date:</label>
                <input
                  type="date"
                  className="border border-gray-400 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onChange={(e) =>
                    handleChange(null, "endDate", e.target.value)
                  }
                />
              </div>
              <div>
                <label className="block mb-1">Start Time:</label>
                <input
                  type="time"
                  className="border border-gray-400 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onChange={(e) =>
                    handleChange(null, "startTime", e.target.value)
                  }
                />
              </div>
              <div>
                <label className="block mb-1">End Time:</label>
                <input
                  type="time"
                  className="border border-gray-400 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onChange={(e) =>
                    handleChange(null, "endTime", e.target.value)
                  }
                />
              </div>
              <div>
                <label className="block mb-1">
                  Number of people travelling in trip:
                </label>
                <input
                  type="number"
                  className="border border-gray-400 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onChange={(e) =>
                    handleChange(null, "peopleTravel", parseInt(e.target.value))
                  }
                  placeholder="number of people travelling"
                />
              </div>
            </div>
          </section>
        )}

        {/* Submit */}
        {validationStatus === "approved" && (
          <button
            type="submit"
            className="bg-blue-600 text-white font-semibold sm:w-auto w-full px-6 py-3 mx-86 rounded-full hover:bg-blue-700 transition"
            disabled={loading}
          >
            {loading ? "Registering..." : "Register"}
          </button>
        )}
      </form>
    </div>
  );
}

export default Makeyourtrip;

// import React, { useState } from "react";
// import { FaUserPlus } from "react-icons/fa";
// import { useNavigate } from "react-router-dom";
// import { MdOutlineTravelExplore } from "react-icons/md";
// import { BiSolidContact } from "react-icons/bi";
// import { GrValidate } from "react-icons/gr";
// import axios from "axios";

// function Makeyourtrip() {
//   const navigate = useNavigate();
//   const [message, setMessage] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [validationStatus, setValidationStatus] = useState("");

//   const [formData, setFormData] = useState({
//     traveler: {
//       name: "",
//       email: "",
//       dob: "",
//       gender: "",
//       age: "",
//       nationality: "Indian",
//       address: "",
//     },
//     contactDetails: {
//       mobileNumber: "",
//       friend1: "",
//       emergencyContact1: "",
//       friend2: "",
//       emergencyContact2: "",
//       relationship: "",
//       relationshipContact: "",
//     },
//     proof: {
//       identityProof: "",
//       proofNumber: "",
//       proofImage: null, // Change to null for file
//     },
//     from: "",
//     to: "",
//     meansofTransport: "",
//     startDate: "",
//     endDate: "",
//     startTime: "",
//     endTime: "",
//     peopleTravel: 1,
//   });

//   const handleChange = (section, field, value) => {
//     if (section) {
//       setFormData((prev) => ({
//         ...prev,
//         [section]: {
//           ...prev[section],
//           [field]: value,
//         },
//       }));
//     } else {
//       setFormData((prev) => ({
//         ...prev,
//         [field]: value,
//       }));
//     }
//   };

//   const handleProofImageUpload = async (e) => {
//     const file = e.target.files[0];
//     if (!file) return;

//     // Update formData with the file
//     setFormData((prev) => ({
//       ...prev,
//       proof: {
//         ...prev.proof,
//         proofImage: file,
//       },
//     }));

//     // Create form data for image upload
//     const uploadData = new FormData();
//     uploadData.append("proofImage", file);

//     try {
//       const res = await axios.post(
//         "http://localhost:8000/api/proof/upload", // Fixed endpoint
//         uploadData,
//         {
//           headers: {
//             "Content-Type": "multipart/form-data",
//           },
//         }
//       );

//       setMessage("Image uploaded successfully!");
//       console.log("Upload response:", res.data);
//     } catch (error) {
//       setMessage("Image upload failed ❌");
//       console.error("Upload error:", error);
//     }
//   };

//   const handleRegister = async (e) => {
//     e.preventDefault();

//     // Create FormData for registration (to handle file upload)
//     const registerData = new FormData();

//     // Append all form data
//     registerData.append("traveler", JSON.stringify(formData.traveler));
//     registerData.append("contactDetails", JSON.stringify(formData.contactDetails));
//     registerData.append("proof", JSON.stringify({
//       identityProof: formData.proof.identityProof,
//       proofNumber: formData.proof.proofNumber
//     }));
//     registerData.append("from", formData.from);
//     registerData.append("to", formData.to);
//     registerData.append("meansofTransport", formData.meansofTransport);
//     registerData.append("startDate", formData.startDate);
//     registerData.append("endDate", formData.endDate);
//     registerData.append("startTime", formData.startTime);
//     registerData.append("endTime", formData.endTime);
//     registerData.append("peopleTravel", formData.peopleTravel);

//     // Append the proof image if it exists
//     if (formData.proof.proofImage) {
//       registerData.append("proofImage", formData.proof.proofImage);
//     }

//     try {
//       const res = await axios.post(
//         "http://localhost:8000/api/trips/register",
//         registerData,
//         {
//           headers: {
//             "Content-Type": "multipart/form-data",
//           },
//         }
//       );

//       alert("Trip Registered Successfully!");
//       console.log(res.data);
//       navigate("/dashboard");
//     } catch (error) {
//       alert(error.response?.data?.error || "Registration Failed");
//     }
//   };

// const handleValidate = async (e) => {
//   e.preventDefault();

//   const { identityProof, proofNumber } = formData.proof;

//   if (!identityProof || !proofNumber) {
//     setMessage("All fields are required ❗");
//     return;
//   }

//   try {
//     setLoading(true);
//     setMessage(""); // Clear previous messages

//     console.log("Sending validation request:", { identityProof, proofNumber });

//     const response = await fetch("http://localhost:8000/api/trips/validate", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({
//         identityProof,
//         proofNumber
//       }),
//     });

//     console.log("Response status:", response.status);

//     let data;
//     const contentType = response.headers.get("content-type");
//     if (contentType && contentType.includes("application/json")) {
//       data = await response.json();
//     } else {
//       data = { message: await response.text() };
//     }

//     console.log("Response data:", data);

//     if (response.ok) {
//       setMessage("✅ " + (data.message || "Proof validated successfully!"));
//       setValidationStatus("approved");
//     } else {
//       setMessage("❌ " + (data.message || data.error || "Validation failed"));
//       setValidationStatus("rejected");
//     }

//     setLoading(false);

//   } catch (error) {
//     console.error("Full error:", error);
//     console.error("Error message:", error.message);
//     console.error("Error stack:", error.stack);

//     setMessage(`❌ Server error: ${error.message}`);
//     setValidationStatus("error");
//     setLoading(false);
//   }
// };

//   // const handleValidate = async (e) => {
//   //   e.preventDefault();

//   //   const { identityProof, proofNumber } = formData.proof;

//   //   if (!identityProof || !proofNumber) {
//   //     setMessage("All fields are required ❗");
//   //     return;
//   //   }

//   //   try {
//   //     setLoading(true);
//   //     setValidationStatus("");

//   //     const response = await fetch("http://localhost:8000/api/trips/validate", {
//   //       method: "POST",
//   //       headers: {
//   //         "Content-Type": "application/json",
//   //       },
//   //       body: JSON.stringify({
//   //         identityProof,
//   //         proofNumber
//   //       }),
//   //     });

//   //     const data = await response.json();

//   //     if (response.ok) {
//   //       setMessage("✅ " + (data.message || "Proof validated successfully!"));
//   //       setValidationStatus("approved");
//   //     } else {
//   //       setMessage("❌ " + (data.message || "Validation failed"));
//   //       setValidationStatus("rejected");
//   //     }

//   //     setLoading(false);

//   //   } catch (error) {
//   //     setMessage("❌ Server error - please try again");
//   //     setValidationStatus("error");
//   //     setLoading(false);
//   //   }
//   // };

//   return (
//     <div className="flex mt-20 mb-20 p-8 border border-gray-200 rounded-lg max-w-4xl mx-auto shadow-lg bg-white">
//       <form className="flex flex-col gap-6" onSubmit={handleRegister}>
//         <h1 className="text-3xl font-bold text-center text-violet-600">
//           Make Your Trip For Safe Journey
//         </h1>

//         {/* Personal Info */}
//         <section className="flex flex-col gap-4">
//           <h2 className="flex gap-1 items-center text-lg font-semibold text-gray-700">
//             <FaUserPlus />
//             Personal Information
//           </h2>

//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//             <div>
//               <label className="block mb-1">Name:</label>
//               <input
//                 type="text"
//                 className="border border-gray-400 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 onChange={(e) => handleChange("traveler", "name", e.target.value)}
//                 placeholder="Enter your name"
//               />
//             </div>
//             <div>
//               <label className="block mb-1">Email:</label>
//               <input
//                 type="email"
//                 className="border border-gray-400 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 onChange={(e) => handleChange("traveler", "email", e.target.value)}
//                 placeholder="Enter your email"
//               />
//             </div>
//           </div>

//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//             <div>
//               <label className="block mb-1">Date Of Birth:</label>
//               <input
//                 type="date"
//                 className="border border-gray-400 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 onChange={(e) => handleChange("traveler", "dob", e.target.value)}
//               />
//             </div>
//             <div>
//               <label className="block mb-1">Gender:</label>
//               <select
//                 className="border border-gray-400 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 onChange={(e) => handleChange("traveler", "gender", e.target.value)}
//               >
//                 <option value="">Select gender</option>
//                 <option value="male">Male</option>
//                 <option value="female">Female</option>
//                 <option value="other">Other</option>
//               </select>
//             </div>
//           </div>

//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//             <div>
//               <label className="block mb-1">Age:</label>
//               <input
//                 className="border border-gray-400 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 onChange={(e) => handleChange("traveler", "age", e.target.value)}
//                 placeholder="Enter your age"
//               />
//             </div>
//             <div>
//               <label className="block mb-1">Nationality:</label>
//               <select
//                 className="border border-gray-400 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 onChange={(e) => handleChange("traveler", "nationality", e.target.value)}
//               >
//                 <option value="Indian">Indian</option>
//                 <option value="United States">United States</option>
//                 <option value="Australia">Australia</option>
//                 <option value="United Kingdom">United Kingdom</option>
//                 <option value="Canada">Canada</option>
//                 <option value="Iran">Iran</option>
//                 <option value="Iraq">Iraq</option>
//                 <option value="other">Other</option>
//               </select>
//             </div>
//           </div>

//           <div>
//             <label className="block mb-1">Address:</label>
//             <input
//               className="border border-gray-400 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
//               onChange={(e) => handleChange("traveler", "address", e.target.value)}
//               placeholder="Enter your address"
//             />
//           </div>
//         </section>

//         <section className="flex flex-col gap-4">
//           <h2 className="flex gap-1 items-center text-lg font-semibold text-gray-700">
//             <BiSolidContact />
//             Contact Details
//           </h2>
//           <div className="grid grid-cols-2 gap-4">
//             <div>
//               <label className="block mb-1">Mobile Number:</label>
//               <input
//                 type="tel"
//                 className="border border-gray-400 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 onChange={(e) => handleChange("contactDetails", "mobileNumber", e.target.value)}
//                 placeholder="Enter your 10-digit mobile number"
//               />
//             </div>
//             <div></div>
//             <div>
//               <label className="block mb-1">Friend 1 :</label>
//               <input
//                 type="text"
//                 className="border border-gray-400 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 onChange={(e) => handleChange("contactDetails", "friend1", e.target.value)}
//                 placeholder="Enter Friend Name"
//               />
//             </div>
//             <div>
//               <label className="block mb-1">Emergency Contact 1 :</label>
//               <input
//                 type="tel"
//                 className="border border-gray-400 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 onChange={(e) => handleChange("contactDetails", "emergencyContact1", e.target.value)}
//                 placeholder="Enter emergency contact number"
//               />
//             </div>
//             <div>
//               <label className="block mb-1">Friend 2 :</label>
//               <input
//                 type="text"
//                 className="border border-gray-400 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 onChange={(e) => handleChange("contactDetails", "friend2", e.target.value)}
//                 placeholder="Enter Friend Name"
//               />
//             </div>
//             <div>
//               <label className="block mb-1">Emergency Contact 2 :</label>
//               <input
//                 type="tel"
//                 className="border border-gray-400 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 onChange={(e) => handleChange("contactDetails", "emergencyContact2", e.target.value)}
//                 placeholder="Enter emergency contact number"
//               />
//             </div>
//             <div>
//               <label className="block mb-1">Relationship :</label>
//               <select
//                 className="border border-gray-400 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 onChange={(e) => handleChange("contactDetails", "relationship", e.target.value)}
//               >
//                 <option value="">Select relation</option>
//                 <option value="father">Father</option>
//                 <option value="mother">Mother</option>
//                 <option value="brother">Brother</option>
//                 <option value="sister">Sister</option>
//                 <option value="other">Other</option>
//               </select>
//             </div>
//             <div>
//               <label className="block mb-1">Relationship Contact :</label>
//               <input
//                 type="tel"
//                 className="border border-gray-400 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 onChange={(e) => handleChange("contactDetails", "relationshipContact", e.target.value)}
//                 placeholder="Enter contact number"
//               />
//             </div>
//           </div>
//         </section>

//         {/* Identity Proof */}
//         <section className="flex flex-col gap-4">
//           <h2 className="flex gap-2 items-center text-lg font-semibold text-gray-700">
//             <GrValidate />
//             Identity Proof
//           </h2>

//           <div className="grid grid-cols-2 gap-4">
//             <div>
//               <label className="block mb-1">Identity Proof</label>
//               <select
//                 className="border border-gray-400 rounded px-3 py-2 w-full"
//                 onChange={(e) => {
//                   const value = e.target.value;
//                   handleChange("proof", "identityProof", value);
//                 }}
//               >
//                 <option value="">Select</option>
//                 <option value="PAN">PAN</option>
//                 <option value="Aadhaar">Aadhaar</option>
//                 <option value="Passport">Passport</option>
//                 <option value="VoterID">VoterID</option>
//                 <option value="DrivingLicense">Driving License</option>
//               </select>
//             </div>
//             <div>
//               <label className="block mb-1">Proof Number</label>
//               <input
//                 className="border border-gray-400 rounded px-3 py-2 w-full"
//                 placeholder="Enter proof number"
//                 onChange={(e) => {
//                   const value = e.target.value;
//                   handleChange("proof", "proofNumber", value);
//                 }}
//               />
//             </div>

//             <div>
//               <label className="block mb-1">Proof Image</label>
//               <input
//                 type="file"
//                 accept="image/*"
//                 className="border border-gray-400 rounded px-3 py-2 w-full"
//                 onChange={handleProofImageUpload}
//               />
//             </div>
//           </div>

//           {/* Validation button and message */}
//           <div className="flex flex-col gap-2">
//             <button
//               type="button"
//               onClick={handleValidate}
//               className="bg-blue-600 text-white font-semibold px-3 py-3 rounded-full hover:bg-blue-700 transition disabled:bg-gray-400"
//               disabled={loading}
//             >
//               {loading ? "Validating..." : "Validate Proof"}
//             </button>

//             {message && (
//               <div className={`p-3 rounded-lg text-center ${
//                 validationStatus === "approved" ? "bg-green-100 text-green-700" :
//                 validationStatus === "rejected" ? "bg-red-100 text-red-700" :
//                 "bg-yellow-100 text-yellow-700"
//               }`}>
//                 {message}
//               </div>
//             )}
//           </div>
//         </section>

//         {/* Trip Details */}
//         <section className="flex flex-col gap-4">
//           <h2 className="flex gap-1 items-center text-lg font-semibold text-gray-700">
//             <MdOutlineTravelExplore />
//             Trip Details
//           </h2>
//           <div className="grid grid-cols-2 gap-4">
//             <div>
//               <label className="block mb-1">From:</label>
//               <input
//                 className="border border-gray-400 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 onChange={(e) => handleChange(null, "from", e.target.value)}
//                 placeholder="Enter starting place"
//               />
//             </div>
//             <div>
//               <label className="block mb-1">To:</label>
//               <input
//                 className="border border-gray-400 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 onChange={(e) => handleChange(null, "to", e.target.value)}
//                 placeholder="Enter destination"
//               />
//             </div>
//             <div className="col-span-2">
//               <label className="block mb-1">Means of transport :</label>
//               <textarea
//                 className="border border-gray-400 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 onChange={(e) => handleChange(null, "meansofTransport", e.target.value)}
//                 placeholder="Ex : Bus, Train, Flight, Car, etc."
//                 rows="3"
//               />
//             </div>
//             <div>
//               <label className="block mb-1">Starting Date:</label>
//               <input
//                 type="date"
//                 className="border border-gray-400 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 onChange={(e) => handleChange(null, "startDate", e.target.value)}
//               />
//             </div>
//             <div>
//               <label className="block mb-1">Ending Date:</label>
//               <input
//                 type="date"
//                 className="border border-gray-400 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 onChange={(e) => handleChange(null, "endDate", e.target.value)}
//               />
//             </div>
//             <div>
//               <label className="block mb-1">Start Time:</label>
//               <input
//                 type="time"
//                 className="border border-gray-400 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 onChange={(e) => handleChange(null, "startTime", e.target.value)}
//               />
//             </div>
//             <div>
//               <label className="block mb-1">End Time:</label>
//               <input
//                 type="time"
//                 className="border border-gray-400 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 onChange={(e) => handleChange(null, "endTime", e.target.value)}
//               />
//             </div>
//             <div className="col-span-2">
//               <label className="block mb-1">Number of people travelling:</label>
//               <input
//                 type="number"
//                 min="1"
//                 className="border border-gray-400 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 onChange={(e) => handleChange(null, "peopleTravel", parseInt(e.target.value))}
//                 placeholder="Number of people travelling"
//               />
//             </div>
//           </div>
//         </section>

//         {/* Submit */}
//         <button
//           type="submit"
//           className="bg-green-600 text-white font-semibold px-6 py-3 rounded-full hover:bg-green-700 transition"
//         >
//           Register Trip
//         </button>
//       </form>
//     </div>
//   );
// }

// export default Makeyourtrip;

// // import React, { useState } from "react";
// // import { FaUserPlus } from "react-icons/fa";
// // import { useNavigate } from "react-router-dom";
// // import { MdOutlineTravelExplore } from "react-icons/md";
// // import { BiSolidContact } from "react-icons/bi";
// // import { GrValidate } from "react-icons/gr";
// // import axios from "axios";
// // // import contactdetails from "./ContactDetails"

// // function Makeyourtrip() {
// //   const navigate = useNavigate();
// //   const [identityProof, setIdentityProof] = useState("");
// //   const [proofNumber, setProofNumber] = useState("");
// //   const [proofImage, setProofImage] = useState(null);
// //   const [message, setMessage] = useState("");
// //   const [loading, setLoading] = useState(false);

// //   const [formData, setFormData] = useState({
// //     traveler: {
// //       name: "",
// //       email: "",
// //       dob: "",
// //       gender: "",
// //       age: "",
// //       nationality: "Indian",
// //       address: "",
// //     },
// //     contactDetails: {
// //       mobileNumber: "",
// //       friend1: "",
// //       emergencyContact1: "",
// //       friend2: "",
// //       emergencyContact2: "",
// //       relationship: "",
// //       relationshipContact: "",
// //     },
// //     proof: {
// //       identityProof: "",
// //       proofNumber: "",
// //       proofImage: "",
// //     },
// //     from: "",
// //     to: "",
// //     meansofTransport: "",
// //     startDate: "",
// //     endDate: "",
// //     startTime: "",
// //     endTime: "",
// //     peopleTravel: 1,
// //   });

// //   const handleChange = (section, field, value) => {
// //     if (section) {
// //       setFormData((prev) => ({
// //         ...prev,
// //         [section]: {
// //           ...prev[section],
// //           [field]: value,
// //         },
// //       }));
// //     } else {
// //       setFormData((prev) => ({
// //         ...prev,
// //         [field]: value,
// //       }));
// //     }
// //   };

// //   const handleProofImageUpload = async (e) => {
// //     const file = e.target.files[0];
// //     if (!file) return;

// //     setProofImage(file);

// //     // Create form data for image upload
// //     const formDataUpload = new FormData();
// //     formDataUpload.append("proofImage", file);

// //     try {
// //       const res = await axios.post(
// //         "http://localhost:8000/proofupload",
// //         formDataUpload,
// //         {
// //           headers: {
// //             "Content-Type": "multipart/form-data",
// //           },
// //         },
// //       );

// //       // Update formData with proof details and image URL
// //       setFormData((prev) => ({
// //         ...prev,
// //         proof: {
// //           identityProof,
// //           proofNumber,
// //           proofImage: res.data.imageUrl, // or whatever backend returns
// //         },
// //       }));

// //       setMessage("Image uploaded successfully!");
// //     } catch (error) {
// //       setMessage("Image upload failed ❌");
// //       console.error("Upload error:", error);
// //     }
// //   };

// //   const handleRegister = async (e) => {
// //     e.preventDefault();

// //     try {
// //       const res = await axios.post(
// //         "http://localhost:8000/api/trips/register",
// //         formData,
// //       );

// //       alert("Trip Registered Successfully!");
// //       console.log(res.data);

// //       navigate("/dashboard"); // optional
// //     } catch (error) {
// //       alert(error.response?.data?.error || "Registration Failed");
// //     }
// //   };
// // const handleValidate = async (e) => {
// //   e.preventDefault();

// //   const { identityProof, proofNumber } = formData.proof;

// //   if (!identityProof || !proofNumber) {
// //     setMessage("All fields are required ❗");
// //     return;
// //   }

// //   try {
// //     setLoading(true);

// //     const response = await fetch("http://localhost:8000/api/trips/validate", {
// //       method: "POST",
// //       headers: {
// //         "Content-Type": "application/json",
// //       },
// //       body: JSON.stringify({
// //         identityProof,
// //         proofNumber
// //       }),
// //     });

// //     const data = await response.json();

// //     if (response.ok) {
// //       setMessage(data.message);
// //       // Maybe update formData with validation status
// //     } else {
// //       setMessage(data.message || "Validation failed");
// //     }

// //     setLoading(false);

// //   } catch (error) {
// //     setMessage("Server error ❌");
// //     setLoading(false);
// //   }
// // };
// //   // const handleValidate = async (e) => {
// //   //   e.preventDefault();

// //   //   if (!identityProof || !proofNumber) {
// //   //     setMessage("All fields are required ❗");
// //   //     return;
// //   //   }

// //   //   try {
// //   //     setLoading(true);

// //   //     const response = await fetch("http://localhost:8000/api/trips/validate", {
// //   //       method: "POST",
// //   //       headers: {
// //   //         "Content-Type": "application/json",
// //   //       },
// //   //       body: JSON.stringify({ identityProof, proofNumber }),
// //   //     });

// //   //     const data = await response.text();
// //   //     setMessage(data);
// //   //     setLoading(false);
// //   //   } catch (error) {
// //   //     setMessage("Server error ❌");
// //   //     setLoading(false);
// //   //   }
// //   // };

// //   // const validateProof = async () => {
// //   //   try {
// //   //     const formData = new FormData();
// //   //     formData.append("identityProof", identityProof);
// //   //     formData.append("proofNumber", proofNumber);
// //   //     formData.append("proofImage", proofImage);

// //   //     const res = await axios.post(
// //   //       "http://localhost:8000/api/proof/upload",
// //   //       formData,
// //   //       {
// //   //         headers: { "Content-Type": "multipart/form-data" },
// //   //       }
// //   //     );

// //   //     alert("Proof uploaded successfully!");
// //   //     console.log(res.data);
// //   //   } catch (err) {
// //   //     alert(err.response?.data?.error || "Upload failed");
// //   //   }
// //   // };
// //   return (
// //     <div className="flex mt-20 mb-20 p-8 border border-gray-200 rounded-lg max-w-4xl mx-auto shadow-lg bg-white">
// //       <form className="flex flex-col gap-6" onSubmit={handleRegister}>
// //         <h1 className="text-3xl font-bold text-center text-violet-600">
// //           Make Your Trip For Safe Journey
// //         </h1>

// //         {/* Personal Info */}
// //         <section className="flex flex-col gap-4">
// //           <h2 className="flex gap-1 items-center text-lg font-semibold text-gray-700">
// //             <FaUserPlus />
// //             Personal Information
// //           </h2>

// //           {/* Use grid for responsive two-column layout */}
// //           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
// //             <div>
// //               <label className="block mb-1">Name:</label>
// //               <input
// //                 type="text"
// //                 className="border border-gray-400 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
// //                 onChange={(e) =>
// //                   handleChange("traveler", "name", e.target.value)
// //                 }
// //                 placeholder="Enter your name"
// //               />
// //             </div>
// //             <div>
// //               <label className="block mb-1">Email:</label>
// //               <input
// //                 type="email"
// //                 className="border border-gray-400 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
// //                 onChange={(e) =>
// //                   handleChange("traveler", "email", e.target.value)
// //                 }
// //                 placeholder="Enter your email"
// //               />
// //             </div>
// //           </div>

// //           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
// //             <div>
// //               <label className="block mb-1">Date Of Birth:</label>
// //               <input
// //                 type="date"
// //                 className="border border-gray-400 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
// //                 onChange={(e) =>
// //                   handleChange("traveler", "dob", e.target.value)
// //                 }
// //               />
// //             </div>
// //             <div>
// //               <label className="block mb-1">Gender:</label>
// //               <select
// //                 className="border border-gray-400 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
// //                 onChange={(e) =>
// //                   handleChange("traveler", "gender", e.target.value)
// //                 }
// //               >
// //                 <option value="">Select gender</option>
// //                 <option value="male">Male</option>
// //                 <option value="female">Female</option>
// //                 <option value="other">Other</option>
// //               </select>
// //             </div>
// //           </div>

// //           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
// //             <div>
// //               <label className="block mb-1">Age:</label>
// //               <input
// //                 className="border border-gray-400 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
// //                 onChange={(e) =>
// //                   handleChange("traveler", "age", e.target.value)
// //                 }
// //                 placeholder="Enter your age"
// //               />
// //             </div>
// //             <div>
// //               <label className="block mb-1">Nationality:</label>
// //               <select
// //                 className="border border-gray-400 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
// //                 onChange={(e) =>
// //                   handleChange("traveler", "nationality", e.target.value)
// //                 }
// //               >
// //                 <option value="india">Indian</option>
// //                 <option value="united states">United States</option>
// //                 <option value="australia">Australia</option>
// //                 <option value="united kingdom">United Kingdom</option>
// //                 <option value="Canada">Canada</option>
// //                 <option value="iran">Iran</option>
// //                 <option value="iraq">Iraq</option>
// //                 <option value="other">Other</option>
// //               </select>
// //             </div>
// //           </div>

// //           <div>
// //             <label className="block mb-1">Address:</label>
// //             <input
// //               className="border border-gray-400 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
// //               onChange={(e) =>
// //                 handleChange("traveler", "address", e.target.value)
// //               }
// //               placeholder="Enter your address"
// //             />
// //           </div>
// //         </section>

// //         <section className="flex flex-col gap-4">
// //           <h2 className="flex gap-1 items-center text-lg font-semibold text-gray-700">
// //             <BiSolidContact />
// //             Contact Details
// //           </h2>
// //           <div className="grid grid-cols-2 gap-4">
// //             <div>
// //               <label className="block mb-1">Mobile Number:</label>
// //               <input
// //                 type="tel"
// //                 className="border border-gray-400 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
// //                 onChange={(e) =>
// //                   handleChange("contactDetails", "mobileNumber", e.target.value)
// //                 }
// //                 placeholder="Enter your 10-digit mobile number without country code"
// //               />
// //             </div>
// //             <div></div>
// //             <div>
// //               <label className="block mb-1">Friend 1 :</label>
// //               <input
// //                 type="text"
// //                 className="border border-gray-400 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
// //                 onChange={(e) =>
// //                   handleChange("contactDetails", "friend1", e.target.value)
// //                 }
// //                 placeholder="Enter Friend Name"
// //               />
// //             </div>
// //             <div>
// //               <label className="block mb-1">Emergency Contact 1 :</label>
// //               <input
// //                 type="tel"
// //                 className="border border-gray-400 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
// //                 onChange={(e) =>
// //                   handleChange(
// //                     "contactDetails",
// //                     "emergencyContact1",
// //                     e.target.value,
// //                   )
// //                 }
// //                 placeholder="Enter your 10-digit mobile number without country code"
// //               />
// //             </div>
// //             <div>
// //               <label className="block mb-1">Friend 2 :</label>
// //               <input
// //                 type="text"
// //                 className="border border-gray-400 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
// //                 onChange={(e) =>
// //                   handleChange("contactDetails", "friend2", e.target.value)
// //                 }
// //                 placeholder="Enter Friend Name"
// //               />
// //             </div>
// //             <div>
// //               <label className="block mb-1">Emergency Contact 2 :</label>
// //               <input
// //                 type="tel"
// //                 className="border border-gray-400 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
// //                 onChange={(e) =>
// //                   handleChange(
// //                     "contactDetails",
// //                     "emergencyContact2",
// //                     e.target.value,
// //                   )
// //                 }
// //                 placeholder="Enter your 10-digit mobile number without country code"
// //               />
// //             </div>
// //             <div>
// //               <label className="block mb-1">RelationShip :</label>
// //               <select
// //                 className="border border-gray-400 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
// //                 onChange={(e) =>
// //                   handleChange("contactDetails", "relationship", e.target.value)
// //                 }
// //               >
// //                 <option value="">Select relation</option>
// //                 <option value="male">Father</option>
// //                 <option value="female">Mother</option>
// //                 <option value="female">Brother</option>
// //                 <option value="female">Sister</option>
// //                 <option value="other">Other</option>
// //               </select>
// //             </div>
// //             <div>
// //               <label className="block mb-1">RelationShip Contact :</label>
// //               <input
// //                 type="tel"
// //                 className="border border-gray-400 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
// //                 onChange={(e) =>
// //                   handleChange(
// //                     "contactDetails",
// //                     "relationshipMobileNumber",
// //                     e.target.value,
// //                   )
// //                 }
// //                 placeholder="Enter your 10-digit mobile number without country code"
// //               />
// //             </div>
// //           </div>
// //         </section>

// //         {/* Identity Proof */}
// //         <section className="flex flex-col gap-4">
// //           <h2 className="flex gap-2 items-center text-lg font-semibold text-gray-700">
// //             <GrValidate />
// //             Identity Proof
// //           </h2>

// //           <div className="grid grid-cols-2 gap-4">
// //             <div>
// //               <label className="block mb-1">Identity Proof</label>
// //               <select
// //                 className="border border-gray-400 rounded px-3 py-2 w-full"
// //                 placeholder="Select identity proof type"
// //                 // onChange={(e) => handleChange("proof", "identityProof", e.target.value)}
// //                 onChange={(e) => {
// //                   const value = e.target.value;
// //                   // Update formData
// //                   handleChange("proof", "identityProof", value);
// //                   // Update local state for validation
// //                   setIdentityProof(value);
// //                 }}
// //                 // onChange={(e) => setIdentityProof(e.target.value)}
// //               >
// //                 <option value="">Select</option>
// //                 <option value="PAN">PAN</option>
// //                 <option value="Aadhaar">Aadhaar</option>
// //                 <option value="Passport">Passport</option>
// //                 <option value="VoterID">VoterID</option>
// //                 <option value="DrivingLicense">Driving License</option>
// //               </select>
// //             </div>
// //             <div>
// //               <label className="block mb-1">Proof Number</label>
// //               <input
// //                 className="border border-gray-400 rounded px-3 py-2 w-full"
// //                 placeholder="Enter proof number"
// //                 // onChange={(e) => handleChange("proof", "proofNumber", e.target.value)}
// //                 onChange={(e) => {
// //                   const value = e.target.value;
// //                   // Update formData
// //                   handleChange("proof", "proofNumber", value);
// //                   // Update local state for validation
// //                   setProofNumber(value);
// //                 }}
// //               />
// //             </div>

// //             <div>
// //               <label className="block mb-1">Proof Image</label>
// //               <input
// //                 type="file"
// //                 accept="image/*"
// //                 className="border border-gray-400 rounded px-3 py-2 w-full"
// //                 // onChange={(e) => handleChange("proof", "proofImage", e.target.files[0])}
// //                 // onChange={handleProofImageUpload}
// //                 onChange={(e) => {
// //                   const value = e.target.value;
// //                   // Update formData
// //                   handleChange("proof", "proofImage", value);
// //                   // Update local state for validation
// //                   setProofImage(value);
// //                 }}
// //                 // onChange={(e) => setProofImage(e.target.files[0])}
// //               />
// //             </div>
// //           </div>
// //           <button
// //             onClick={handleValidate}
// //             className="bg-blue-600 text-white font-semibold sm:w-auto w-full px-3 py-3 mx-86 rounded-full hover:bg-blue-700 transition"
// //             disabled={loading}
// //           >
// //             {loading ? "Validating..." : "Validate Proof"}
// //           </button>
// //         </section>

// //         {/* Trip Details */}
// //         <section className="flex flex-col gap-4">
// //           <h2 className="flex gap-1 items-center text-lg font-semibold text-gray-700">
// //             <MdOutlineTravelExplore />
// //             Trip Details
// //           </h2>
// //           <div className="grid grid-cols-2 gap-4">
// //             <div>
// //               <label className="block mb-1">From:</label>
// //               <input
// //                 className="border border-gray-400 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
// //                 onChange={(e) =>
// //                   handleChange("tripDetails", "from", e.target.value)
// //                 }
// //                 placeholder="Enter starting place"
// //               />
// //             </div>
// //             <div>
// //               <label className="block mb-1">To:</label>
// //               <input
// //                 className="border border-gray-400 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
// //                 onChange={(e) =>
// //                   handleChange("tripDetails", "to", e.target.value)
// //                 }
// //                 placeholder="Enter destination"
// //               />
// //             </div>
// //             <div>
// //               <label className="block mb-1">Means of transport :</label>
// //               <textarea
// //                 type="text"
// //                 className="border border-gray-400 rounded px-3 py-2 w-[830px] focus:outline-none focus:ring-2 focus:ring-blue-500"
// //                 onChange={(e) =>
// //                   handleChange(
// //                     "tripDetails",
// //                     "meansOfTransport",
// //                     e.target.value,
// //                   )
// //                 }
// //                 placeholder="Ex : Bus, Train, Flight, Car, etc."
// //               />
// //             </div>
// //             <div></div>
// //             <div>
// //               <label className="block mb-1">Starting Date:</label>
// //               <input
// //                 type="date"
// //                 className="border border-gray-400 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
// //                 onChange={(e) =>
// //                   handleChange("tripDetails", "startDate", e.target.value)
// //                 }
// //               />
// //             </div>
// //             <div>
// //               <label className="block mb-1">Ending Date:</label>
// //               <input
// //                 type="date"
// //                 className="border border-gray-400 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
// //                 onChange={(e) =>
// //                   handleChange("tripDetails", "endDate", e.target.value)
// //                 }
// //               />
// //             </div>
// //             <div>
// //               <label className="block mb-1">Start Time:</label>
// //               <input
// //                 type="time"
// //                 className="border border-gray-400 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
// //                 onChange={(e) =>
// //                   handleChange("tripDetails", "startTime", e.target.value)
// //                 }
// //               />
// //             </div>
// //             <div>
// //               <label className="block mb-1">End Time:</label>
// //               <input
// //                 type="time"
// //                 className="border border-gray-400 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
// //                 onChange={(e) =>
// //                   handleChange("tripDetails", "endTime", e.target.value)
// //                 }
// //               />
// //             </div>
// //             <div>
// //               <label className="block mb-1">
// //                 Number of people travelling in trip:
// //               </label>
// //               <input
// //                 type="number"
// //                 className="border border-gray-400 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
// //                 onChange={(e) =>
// //                   handleChange("tripDetails", "numberOfPeople", e.target.value)
// //                 }
// //                 placeholder="number of people travelling"
// //               />
// //             </div>
// //           </div>
// //         </section>

// //         {/* Submit */}
// //         <button
// //           // onClick={() => navigate("/contactdetails")}
// //           type="button"
// //           onClick={handleRegister}
// //           className="bg-blue-600 text-white font-semibold sm:w-auto w-full px-6 py-3 mx-86 rounded-full hover:bg-blue-700 transition"
// //         >
// //           Register
// //         </button>
// //       </form>
// //     </div>
// //   );
// // }

// // export default Makeyourtrip;
