import React from "react";
import "./Guidance.css";
import GuidanceCard from "../../components/GuidanceCard.jsx";
import EmergencyContacts from "../../components/EmergencyContacts.jsx";
import { guidanceTips, emergencySteps } from "../../data/guidanceData";
import SafeMap from "../../components/SafeMap.jsx";
import SafetyScore from "../../components/SafetyScore.jsx";
import EmergencyByLocation from "../../components/EmergencyByLocation.jsx";

function Guidance() {
  return (
    <>
      <div className="guidance-container">
        <h1>Tourist Safety & Emergency Guidance</h1>
        {/* <div
          style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 16 }}
        >
          <div>
            <SafeMap />
          </div>
          <aside>
            <SafetyScore />
            <EmergencyByLocation />
            {/* add quick SOS button and cached guidance */}
            {/* <div style={{ marginTop: 16 }}>
              <button
                style={{
                  background: "red",
                  color: "white",
                  padding: "10px 14px",
                }}
                onClick={() => alert("SOS triggered (mock)")}
              >
                SOS
              </button>
            </div>
          </aside>
        </div> */} 
        <div className="guidance-grid">
          <div>
            <SafeMap />
          </div>

          <aside>
            <SafetyScore />
            <EmergencyByLocation />

            <div>
              <button
                className="sos-btn"
                onClick={() => alert("SOS triggered (mock)")}
              >
                SOS
              </button>
            </div>
          </aside>
        </div>
      </div>
      <div className="guidance-container">
        <h1>Tourist Safety & Emergency Guidance</h1>

        <section>
          <h2>Safety Guidance</h2>
          {guidanceTips.map((tip, index) => (
            <GuidanceCard
              key={index}
              title={tip.title}
              description={tip.description}
            />
          ))}
        </section>

        <section>
          <h2>Emergency Response Steps</h2>
          {emergencySteps.map((item, index) => (
            <div key={index} className="emergency-box">
              <h3>{item.title}</h3>
              <ul>
                {item.steps.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        <EmergencyContacts />
      </div>
    </>
  );
}

export default Guidance;
