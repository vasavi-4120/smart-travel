import React from "react";

const EmergencyContacts = () => {
  return (
    <div className="contacts-box">
      <h2>Emergency Contacts</h2>
      <ul>
        <li><strong>Police:</strong> 100</li>
        <li><strong>Ambulance:</strong> 108</li>
        <li><strong>Tourist Helpline:</strong> 1363</li>
      </ul>

      <button className="sos-btn" onClick={() => alert("SOS Triggered!")}>
        Send SOS Alert
      </button>
    </div>
  );
};

export default EmergencyContacts;
