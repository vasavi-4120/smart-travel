import React, { useContext } from "react";
import { userDataContext } from "../../context/UserContext";
import profile from "../../assets/profile.png";
import { useNavigate } from "react-router-dom";

function Editprofile() {
  const { userData, setUserData, loading } = useContext(userDataContext);
  const navigate = useNavigate();

  // Handle loading state to prevent "undefined" errors
  if (loading || !userData)
    return <div className="text-center my-20">Loading...</div>;

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("username", userData.username);
    formData.append("email", userData.email);
    formData.append("contact", userData.contact);
    formData.append("address", userData.address);

    // Ensure you're appending the actual File object
    if (userData.profileImage instanceof File) {
      formData.append("profileImage", userData.profileImage);
    }

    try {
      const response = await fetch(
        "http://localhost:8000/api/auth/updateProfile",
        {
          method: "PUT",
          body: formData,
          // Don't set Content-Type header manually when using FormData;
          // the browser does it automatically with the boundary string.
          credentials: "include",
        },
      );

      const result = await response.json();
      if (result.success) {
        setUserData(result.user);
        console.log("Sending to Backend:", Object.fromEntries(formData));
        alert("Profile updated successfully!");
        navigate("/profile");
      } else {
        alert(result.message || "Error updating profile");
      }
    } catch (error) {
      console.error("Update failed:", error);
      alert("Something went wrong");
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUserData({ ...userData, profileImage: file });
    }
  };

  return (
    <div className="flex flex-col lg:flex-row items-center justify-center my-16 gap-12 px-4">
      {/* Changed onClick to onSubmit */}
      <form onSubmit={handleSubmit} className="w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <div className="relative">
            
            <img
              src={
                // 1. If user just picked a new file, show local preview
                userData.profileImage instanceof File
                  ? URL.createObjectURL(userData.profileImage)
                  : // 2. If database has an image object, show the server URL
                    userData.profileImage?.url
                    ? `http://localhost:8000/${userData.profileImage.url.replace(/\\/g, "/")}`
                    : // 3. Otherwise, show default placeholder
                      profile
              }
              alt="Profile"
              className="rounded-full h-24 w-24 object-cover ring-4 ring-violet-300"
            />
          </div>
          {/* Added File Input */}
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="mt-2 text-xs text-gray-500"
          />
        </div>

        {/* Name */}
        <div className="mb-4">
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Name
          </label>
          <input
            type="text"
            id="name"
            value={userData.username || ""}
            onChange={(e) =>
              setUserData({ ...userData, username: e.target.value })
            }
            className="border border-gray-300 rounded-md px-4 py-2 w-full focus:ring-2 focus:ring-violet-500"
          />
        </div>

        {/* Email */}
        <div className="mb-4">
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Email
          </label>
          <input
            type="text"
            id="email"
            value={userData.email || ""}
            onChange={(e) =>
              setUserData({ ...userData, email: e.target.value })
            }
            className="border border-gray-300 rounded-md px-4 py-2 w-full focus:ring-2 focus:ring-violet-500"
          />
        </div>

        {/* Contact */}
        <div className="mb-4">
          <label
            htmlFor="contact"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Contact
          </label>
          <input
            type="text"
            id="contact"
            value={userData.contact || ""}
            onChange={(e) =>
              setUserData({ ...userData, contact: e.target.value })
            }
            className="border border-gray-300 rounded-md px-4 py-2 w-full focus:ring-2 focus:ring-violet-500"
          />
        </div>

        {/* Address */}
        <div className="mb-4">
          <label
            htmlFor="address"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Address
          </label>
          <textarea
            id="address"
            value={userData.address || ""}
            onChange={(e) =>
              setUserData({ ...userData, address: e.target.value })
            }
            className="border border-gray-300 rounded-md px-4 py-2 w-full focus:ring-2 focus:ring-violet-500"
            rows="3"
          ></textarea>
        </div>

        <div className="flex gap-4 mt-6 justify-center">
          <button
            type="submit" // This triggers the form onSubmit
            className="bg-violet-500 hover:bg-violet-600 transition text-white px-6 py-2.5 rounded-full font-medium"
          >
            Update Profile
          </button>
          <button
            type="button" // Prevents form submission
            onClick={() => navigate("/profile")}
            className="border border-violet-500 text-violet-500 hover:bg-violet-50 transition px-6 py-2.5 rounded-full font-medium"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default Editprofile;
