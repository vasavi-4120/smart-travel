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
  const [errors, setErrors] = useState({});
  const serverUrl =  import.meta.env.VITE_SERVER_URL || "http://localhost:8000" ;

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
      emergencyemail1: "",
      friend2: "",
      emergencyContact2: "",
      emergencyemail2: "",
      relationship: "",
      relationshipContact: "",
      relationshipemail: "",
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
    accommodation: "",
    purposeOfWork: "",
    meansOfTransport: "",
    startDate: "",
    endDate: "",
    startTime: "",
    endTime: "",
    peopleTravel: 1,
  });

  const fetchCoordinates = async (placeName) => {
    try {
      const res = await axios.get(`${serverUrl}/api/trips/geocode`, {
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
  let error = "";

  // Validation rules
  if (field === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    error = "Invalid email format";
  }
  if (field === "name" && value.trim().length < 3) {
    error = "Name must be at least 3 characters";
  }
  if (field === "age" && (isNaN(value) || value <= 0)) {
    error = "Age must be a positive number";
  }
  if (field === "dob" && !value ) {
    error = "Date of Birth is required";
  }
  if (field === "gender" && !["male", "female", "other"].includes(value.toLowerCase())) {
    error = "Invalid gender";
  }
  if (field === "address" && value.trim().length < 5) {
    error = "Address must be at least 5 characters";
  }
  if (field === "mobileNumber" && !/^\d{10}$/.test(value)) {
    error = "Invalid mobile number";
  }
  if (field === "emergencyemail1" && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    error = "Invalid emergency email 1";
  }
  if (field === "relationshipemail" && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    error = "Invalid relationship email";
  }



  // Update form data
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

  // Update errors
  setErrors((prev) => ({
    ...prev,
    [field]: error,
  }));
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
        `${serverUrl}/api/proof/upload`,
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
    const hasErrors = Object.values(errors).some((err) => err);
  if (hasErrors) {
    alert("Please fix the errors before submitting.");
    return;
  }

    try {
      setLoading(true);

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
        accommodation: formData.accommodation,
        purposeOfWork: formData.purposeOfWork,
        meansOfTransport: formData.meansOfTransport,
        peopleTravel: Number(formData.peopleTravel),
        numberOfDaysStaying: Number(formData.numberOfDaysStaying),
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
        `${serverUrl}/api/trips/register`,
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

      const response = await fetch(`${serverUrl}/api/proof/validate`, {
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
    // <div className="flex mt-20 mb-20 p-8 border border-gray-200 rounded-lg max-w-4xl mx-auto shadow-lg bg-white">
    <div className="w-full overflow-hidden">
      <div className="w-full px-4 sm:px-6 lg:px-8 mt-10 mb-10">
        <div
          className="border border-gray-200 rounded-lg shadow-lg bg-white 
  max-w-5xl mx-auto p-4 sm:p-6 lg:p-8"
        >
          {/* <form className="flex flex-col gap-6" onSubmit={handleRegister}> */}
          <form
            className="flex flex-col gap-6 w-full"
            onSubmit={handleRegister}
          >
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-center text-violet-600">
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
                  <label className="block mb-1">Name:<span className="text-red-500">*</span>
</label>
                  <input
                    type="text"
                    // className="border border-gray-400 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                    className="w-full border border-gray-400 rounded px-3 py-2 
focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onChange={(e) =>
                      handleChange("traveler", "name", e.target.value)
                    }
                    placeholder="Enter your name"
                    required
                  />
                  {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
                </div>
                <div>
                  <label className="block mb-1">Email:<span className="text-red-500">*</span>
</label>
                  <input
                    type="email"
                    // className="border border-gray-400 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                    className="w-full border border-gray-400 rounded px-3 py-2 
focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onChange={(e) =>
                      handleChange("traveler", "email", e.target.value)
                    }
                    placeholder="Enter your email"
                    required
                  />
                  {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1">Date Of Birth:<span className="text-red-500">*</span>
</label>
                  <input
                    type="date"
                    // className="border border-gray-400 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                    className="w-full border border-gray-400 rounded px-3 py-2 
focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onChange={(e) =>
                      handleChange("traveler", "dob", e.target.value)
                    }
                    required
                  />
                  {errors.dob && <p className="text-red-500 text-sm">{errors.dob}</p>}
                </div>
                <div>
                  <label className="block mb-1">Gender:<span className="text-red-500">*</span>
</label>
                  <select
                    // className="border border-gray-400 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                    className="w-full border border-gray-400 rounded px-3 py-2 
focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onChange={(e) =>
                      handleChange("traveler", "gender", e.target.value)
                    }
                    required
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                  {errors.gender && <p className="text-red-500 text-sm">{errors.gender}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1">Age:<span className="text-red-500">*</span>
</label>
                  <input
                    // className="border border-gray-400 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                    className="w-full border border-gray-400 rounded px-3 py-2 
focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onChange={(e) =>
                      handleChange("traveler", "age", e.target.value)
                    }
                    placeholder="Enter your age"
                    required
                  />
                  {errors.age && <p className="text-red-500 text-sm">{errors.age}</p>}
                </div>
                <div>
                  <label className="block mb-1">Nationality:<span className="text-red-500">*</span>
</label>
                  <select
                    // className="border border-gray-400 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                    className="w-full border border-gray-400 rounded px-3 py-2 
focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onChange={(e) =>
                      handleChange("traveler", "nationality", e.target.value)
                    }
                    required
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
                <label className="block mb-1">Address:<span className="text-red-500">*</span>
</label>
                <input
                  // className="border border-gray-400 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                  className="w-full border border-gray-400 rounded px-3 py-2 
focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onChange={(e) =>
                    handleChange("traveler", "address", e.target.value)
                  }
                  placeholder="Enter your address"
                  required
                />
                {errors.address && <p className="text-red-500 text-sm">{errors.address}</p>}
              </div>
            </section>

            <section className="flex flex-col gap-4">
              <h2 className="flex gap-1 items-center text-lg font-semibold text-gray-700">
                <BiSolidContact />
                Contact Details
              </h2>
              {/* <div className="grid grid-cols-2 gap-4"> */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1">Mobile Number:<span className="text-red-500">*</span>
</label>
                  <input
                    type="tel"
                    // className="border border-gray-400 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                    className="w-full border border-gray-400 rounded px-3 py-2 
focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onChange={(e) =>
                      handleChange(
                        "contactDetails",
                        "mobileNumber",
                        e.target.value,
                      )
                    }
                    placeholder="Enter your 10-digit mobile number without country code"
                    required
                  />
                  {errors.mobileNumber && <p className="text-orange-500 text-sm">{errors.mobileNumber}</p>}
                </div>
                <div></div>
                <div>
                  <label className="block mb-1">Friend 1 :<span className="text-red-500">*</span>
</label>
                  <input
                    type="text"
                    // className="border border-gray-400 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                    className="w-full border border-gray-400 rounded px-3 py-2 
focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onChange={(e) =>
                      handleChange("contactDetails", "friend1", e.target.value)
                    }
                    placeholder="Enter Friend Name"
                    required
                  />
                  {errors.name && <p className="text-orange-500 text-sm">{errors.name}</p>}
                </div>
                <div>
                  <label className="block mb-1">Emergency Contact 1 :<span className="text-red-500">*</span>
</label>
                  <input
                    type="tel"
                    // className="border border-gray-400 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                    className="w-full border border-gray-400 rounded px-3 py-2 
focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onChange={(e) =>
                      handleChange(
                        "contactDetails",
                        "emergencyContact1",
                        e.target.value,
                      )
                    }
                    placeholder="Enter your 10-digit mobile number without country code"
                    required
                  />
                  {errors.emergencyContact1 && <p className="text-orange-500 text-sm">{errors.emergencyContact1}</p>}
                </div>
                <div>
                  <label className="block mb-1">Emergency Email 1 :<span className="text-red-500">*</span>
</label>
                  <input
                    type="email"
                    // className="border border-gray-400 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                    className="w-full border border-gray-400 rounded px-3 py-2 
focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onChange={(e) =>
                      handleChange(
                        "contactDetails",
                        "emergencyemail1",
                        e.target.value,
                      )
                    }
                    placeholder="Enter email address"
                    required
                  />
                  {errors.emergencyemail1 && <p className="text-orange-500 text-sm">{errors.emergencyemail1}</p>}
                </div>
                <div></div>
                <div>
                  <label className="block mb-1">Friend 2 :</label>
                  <input
                    type="text"
                    // className="border border-gray-400 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                    className="w-full border border-gray-400 rounded px-3 py-2 
focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    // className="border border-gray-400 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                    className="w-full border border-gray-400 rounded px-3 py-2 
focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  <label className="block mb-1">Emergency Email 2 :</label>
                  <input
                    type="email"
                    // className="border border-gray-400 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                    className="w-full border border-gray-400 rounded px-3 py-2 
focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onChange={(e) =>
                      handleChange(
                        "contactDetails",
                        "emergencyemail2",
                        e.target.value,
                      )
                    }
                    placeholder="Enter email address"
                  />
                </div>
                <div></div>
                <div>
                  <label className="block mb-1">RelationShip :<span className="text-red-500">*</span>
</label>
                  <select
                    // className="border border-gray-400 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                    className="w-full border border-gray-400 rounded px-3 py-2 
focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onChange={(e) =>
                      handleChange(
                        "contactDetails",
                        "relationship",
                        e.target.value,
                      )
                    }
                    required
                  >
                    <option value="">Select relation</option>
                    <option value="father">Father</option>
                    <option value="mother">Mother</option>
                    <option value="brother">Brother</option>
                    <option value="sister">Sister</option>
                    <option value="spouse">Spouse</option>
                    <option value="other">Other</option>
                  </select>
                  {errors.relationship && <p className="text-orange-500 text-sm">{errors.relationship}</p>}
                </div>
                <div>
                  <label className="block mb-1">RelationShip Contact :<span className="text-red-500">*</span>
</label>
                  <input
                    type="tel"
                    // className="border border-gray-400 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                    className="w-full border border-gray-400 rounded px-3 py-2 
focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onChange={(e) =>
                      handleChange(
                        "contactDetails",
                        "relationshipContact",
                        e.target.value,
                      )
                    }
                    placeholder="Enter your 10-digit mobile number without country code"
                    required
                  />
                  {errors.relationshipContact && <p className="text-orange-500 text-sm">{errors.relationshipContact}</p>}
                </div>
                <div>
                  <label className="block mb-1">Relationship Email  :<span className="text-red-500">*</span>
</label>
                  <input
                    type="email"
                    // className="border border-gray-400 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                    className="w-full border border-gray-400 rounded px-3 py-2 
focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onChange={(e) =>
                      handleChange(
                        "contactDetails",
                        "relationshipemail",
                        e.target.value,
                      )
                    }
                    placeholder="Enter email address"
                    required
                  />
                  {errors.relationshipemail && <p className="text-orange-500 text-sm">{errors.relationshipemail}</p>}
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
                  <label className="block mb-1">Identity Proof :<span className="text-red-500">*</span>
</label>
                  <select
                    // className="border border-gray-400 rounded px-3 py-2 w-full"
                    className="w-full border border-gray-400 rounded px-3 py-2 
focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Select identity proof type"
                    onChange={(e) => {
                      const value = e.target.value;
                      handleChange("proof", "identityProof", value);
                      setIdentityProof(value);
                    }}
                    required
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
                  <label className="block mb-1">Proof Number :<span className="text-red-500">*</span>
</label>
                  <input
                    // className="border border-gray-400 rounded px-3 py-2 w-full"
                    className="w-full border border-gray-400 rounded px-3 py-2 
focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter proof number"
                    onChange={(e) => {
                      const value = e.target.value;
                      handleChange("proof", "proofNumber", value);
                      setProofNumber(value);
                    }}
                    required
                  />
                </div>

                <div>
                  <label className="block mb-1">Proof Image :<span className="text-red-500">*</span>
</label>
                  <input
                    type="file"
                    accept="image/*"
                    // className="border border-gray-400 rounded px-3 py-2 w-full"
                    className="w-full border border-gray-400 rounded px-3 py-2 
focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onChange={handleProofImageUpload}
                    required
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
                // className="bg-blue-600 text-white font-semibold sm:w-auto w-full px-3 py-3 mx-86 rounded-full hover:bg-blue-700 transition"
                className="bg-blue-600 text-white font-semibold w-full sm:w-auto 
px-6 py-3 mx-auto rounded-full hover:bg-blue-700 transition"
                disabled={loading}
              >
                {loading ? "Validating..." : "Validate Proof"}
              </button>
              {validationStatus === "approved" && (
                <div className="text-green-600 font-semibold text-center mt-2">
                  ✅ Proof Verified Successfully! You can now enter trip
                  details.
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
                {/* <div className="grid grid-cols-2 gap-4"> */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1">From:<span className="text-red-500">*</span>
</label>
                    <input
                      // className="border border-gray-400 rounded px-3 py-2 w-full"
                      className="w-full border border-gray-400 rounded px-3 py-2 
focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                      onBlur={() =>
                        fetchCoordinates(formData.from.name, "from")
                      }
                      placeholder="Enter starting place"
                      required
                    />
                  </div>

                  <div>
                    <label className="block mb-1">To:<span className="text-red-500">*</span>
</label>
                    <input
                      // className="border border-gray-400 rounded px-3 py-2 w-full"
                      className="w-full border border-gray-400 rounded px-3 py-2 
focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                      required
                    />
                  </div>
                  <div>
                    <label className="block mb-1">Accommodation / Stay :<span className="text-red-500">*</span>
</label>
                    <textarea
                      type="text"
                      className="border border-gray-400 rounded px-3 py-2 w-[950px]  focus:outline-none focus:ring-2 focus:ring-blue-500"
                      // className="border border-gray-400 rounded px-3 py-2  w-full max-w-[900px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onChange={(e) =>
                        handleChange(null, "accommodation", e.target.value)
                      }
                      placeholder="Ex : Hotel(sri venkateshwara near railway station) etc."
                      required
                    />
                  </div>
                  <div></div>
                  <div>
                    <label className="block mb-1">Purpose of work :<span className="text-red-500">*</span>
</label>
                    <input
                      type="text"
                      // className="border border-gray-400 rounded px-3 py-2 w-[830px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                      className="border border-gray-400 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onChange={(e) =>
                        handleChange(null, "purposeOfWork", e.target.value)
                      }
                      placeholder="Ex : Interview, Meeting, Test, Personal visit  etc."
                      required
                    />
                  </div>
                  <div>
                    <label className="block mb-1">Means of transport :<span className="text-red-500">*</span>
</label>
                    <input
                      type="text"
                      // className="border border-gray-400 rounded px-3 py-2 w-[830px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                      className="border border-gray-400 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onChange={(e) =>
                        handleChange(null, "meansOfTransport", e.target.value)
                      }
                      placeholder="Ex : Bus, Train, Flight, Car,Bike etc."
                      required
                    />
                  </div>
                  <div>
                    <label className="block mb-1">Starting Date:<span className="text-red-500">*</span>
</label>
                    <input
                      type="date"
                      className="border border-gray-400 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onChange={(e) =>
                        handleChange(null, "startDate", e.target.value)
                      }
                      placeholder="start date of trip"
                      required
                    />
                  </div>
                  <div>
                    <label className="block mb-1">Ending Date:<span className="text-red-500">*</span>
</label>
                    <input
                      type="date"
                      className="border border-gray-400 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onChange={(e) =>
                        handleChange(null, "endDate", e.target.value)
                      }
                      placeholder="end date of trip"
                      required
                    />
                  </div>
                  <div>
                    <label className="block mb-1">
                      Start Time: [ Enter time in 24hr format ]<span className="text-red-500">*</span>
                    </label>
                    <input
                      type="time"
                      min="00:00"
                      max="23:59"
                      step="60"
                      className="border border-gray-400 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onChange={(e) =>
                        handleChange(null, "startTime", e.target.value)
                      }
                      required
                    />
                  </div>
                  <div>
                    <label className="block mb-1">
                      End Time: [ Enter time in 24hr format ]<span className="text-red-500">*</span>
                    </label>
                    <input
                      type="time"
                      min="00:00"
                      max="23:59"
                      step="60"
                      className="border border-gray-400 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onChange={(e) =>
                        handleChange(null, "endTime", e.target.value)
                      }
                      required
                    />
                  </div>
                  <div>
                    <label className="block mb-1">
                      Number of Days Staying:<span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      className="border border-gray-400 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onChange={(e) =>
                        handleChange(
                          null,
                          "numberOfDaysStaying",
                          parseInt(e.target.value),
                        )
                      }
                      placeholder="number of days staying"
                      required
                    />
                  </div>
                  <div>
                    <label className="block mb-1">
                      Number of people travelling in trip:<span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      className="border border-gray-400 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onChange={(e) =>
                        handleChange(
                          null,
                          "peopleTravel",
                          parseInt(e.target.value),
                        )
                      }
                      placeholder="number of people travelling"
                      required
                    />
                  </div>
                </div>
              </section>
            )}

            {/* Submit */}
            {validationStatus === "approved" && (
              <button
                type="submit"
                // className="bg-blue-600 text-white font-semibold sm:w-auto w-full px-6 py-3 mx-86 rounded-full hover:bg-blue-700 transition"
                className="bg-blue-600 text-white font-semibold w-full sm:w-auto 
px-6 py-3 mx-auto rounded-full hover:bg-blue-700 transition"
                disabled={loading}
              >
                {loading ? "Registering..." : "Register"}
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

export default Makeyourtrip;
